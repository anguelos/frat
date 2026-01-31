from datetime import datetime
import base64
import json
import random
import string
import cherrypy  # also routes are needed
import cv2
import PIL
import hashlib
import jinja2
import tqdm
import pkgutil
from collections import OrderedDict
import zlib
import pathlib
#import fargv
import sys
import os
import io
from PIL import Image
import cv2
from cherrypy.lib import file_generator
import numpy as np
import re


#grouting_js = pkgutil.get_data(__name__, "resources/grouting.js").decode("utf-8")
#grouting_jinja2 = pkgutil.get_data(__name__, "resources/grouting_webpage.jinja2").decode("utf-8")

frat_gui_js = pkgutil.get_data(__name__, "resources/frat_gui.js").decode("utf-8").encode('utf8')
frat_webpage_jinja2 = pkgutil.get_data(__name__, "resources/frat_webpage.jinja2").decode("utf-8")
empty_page_json = pkgutil.get_data(__name__, "resources/empty_page.json").decode("utf-8")
frat_gui_config = json.loads(pkgutil.get_data(__name__, "resources/font_annotation_config.json").decode("utf-8"))


def pillow_to_bytes(img, extention):
    img = np.array(img)
    if(len(img.shape)==3):
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    status, res = cv2.imencode(f".{extention.lower()}", img)
    if status:
        return res.tobytes()
    else:
        raise ValueError

def create_thumb(fname, format="png", width=100, height=-1):
    img_bytes = open(fname, "rb").read()
    md5_str = hashlib.md5(img_bytes).hexdigest()
    img = Image.open(io.BytesIO(img_bytes))
    if height<0:
        old_width, old_height = img.size
        height = int((old_height/old_width)*width)
    img = img.resize((width, height))
    return pillow_to_bytes(img, format), md5_str

@cherrypy.expose
class FratWebServer(object):
    def load_from_local_images(self, image_filenames, img2itempath_regex, gt_filextention, autogt_filextention):
        self.thumbs = []
        self.image_names_to_idx = {}
        self.image_paths = []
        self.json_paths = []
        self.autojson_paths = []
        self.image_urls = []
        for n, image_filename in enumerate(tqdm.tqdm(image_filenames, desc="Creating thumbs")):
            thumb, md5id = create_thumb(image_filename)
            self.image_urls.append(f"{md5id}.png")
            self.thumbs.append(thumb)
            self.image_paths.append(image_filename)
            image_base_paths = re.findall(img2itempath_regex, image_filename)
            assert len(image_base_paths) >= 1 and len(image_base_paths[0]) > 0
            self.json_paths.append(image_base_paths[0]+gt_filextention)
            self.autojson_paths.append(image_base_paths[0]+autogt_filextention)
            self.image_names_to_idx[md5id] = n


    def __init__(self, image_filenames, image_web_format="png", html_template=None, config_dict=None) -> None:
        super().__init__()
        self.config_dict = {}
        if config_dict is None:
            self.config_dict.update(frat_gui_config)
        else:
            print(config_dict.keys())
            print()
            print(frat_gui_config.keys())
            print()
            print(set(config_dict.keys())-set(frat_gui_config))
            print()
            print(set(frat_gui_config)-set(config_dict.keys()))
            assert set(config_dict.keys()) == set(frat_gui_config.keys())
            self.config_dict.update(config_dict)

        if html_template == None:
            self.html_template = jinja2.Template(frat_webpage_jinja2)
        else:
            self.html_template = jinja2.Template(html_template)

        self.image_web_format = image_web_format
        print("INIT", self.config_dict)
        self.load_from_local_images(image_filenames, 
                                    img2itempath_regex=self.config_dict["img2itempath_regex"], 
                                    gt_filextention=self.config_dict["gt_filextention"],
                                    autogt_filextention=self.config_dict["autogt_filextention"])

        self.global_image_size_divisor = config_dict["image_size_divisor"]
        self.global_image_size_multiplier = config_dict["image_size_multiplier"]
        
    
    def scale_json(self, json_str):
        data = json.loads(json_str)
        new_data = data.copy()
        if "image_wh" in new_data.keys():
            new_data["image_wh"] = [(d*self.global_image_size_multiplier)//self.global_image_size_divisor for d in data["image_wh"]]
        new_data["rect_LTRB"] = []
        for rect in data["rect_LTRB"]:
            scaled_rect = [(d*self.global_image_size_multiplier)//self.global_image_size_divisor for d in rect]
            new_data["rect_LTRB"].append(scaled_rect)
        return json.dumps(new_data)


    def unscale_json(self, json_str):
        data = json.loads(json_str)
        new_data = data.copy()
        if "image_wh" in new_data.keys():
            new_data["image_wh"] = [(d*self.global_image_size_divisor)//self.global_image_size_multiplier for d in data["image_wh"]]
        new_data["rect_LTRB"] = []
        for rect in data["rect_LTRB"]:
            unscaled_rect = [(d*self.global_image_size_divisor)//self.global_image_size_multiplier for d in rect]
            new_data["rect_LTRB"].append(unscaled_rect)
        return json.dumps(new_data)



    def render_page_image(self, image_id):
        img_path = self.image_paths[self.image_names_to_idx[image_id]]
        img = Image.open(img_path)
        new_width = (self.global_image_size_multiplier*img.size[0])//self.global_image_size_divisor
        new_height = (self.global_image_size_multiplier*img.size[1])//self.global_image_size_divisor
        img = img.resize([new_width, new_height])
        cherrypy.response.headers['Content-Type'] = f"image/{self.image_web_format}"
        return pillow_to_bytes(img, self.image_web_format)
    
    def render_thumb(self, image_id):
        cherrypy.response.headers['Content-Type'] = f"image/{self.image_web_format}"
        return self.thumbs[self.image_names_to_idx[image_id]]
    
    def render_gt(self, image_id):
        cherrypy.response.headers['Content-Type'] = "application/json"
        json_path = self.json_paths[self.image_names_to_idx[image_id]]
        if(os.path.exists(json_path)):
            res_json = self.scale_json(open(json_path,"r").read())
        else:
            res_json = self.scale_json(empty_page_json)
        return res_json.encode('utf8')

    def render_html(self, image_id):
        cherrypy.response.headers['Content-Type'] = "text/html"
        return self.html_template.render(id=image_id, img_url=self.image_urls[self.image_names_to_idx[image_id]])

    def render_index(self):
        cherrypy.response.headers['Content-Type'] = "text/html"
        res=f"<html><body><table>"
        for n, name in sorted([(n, name) for name, n in self.image_names_to_idx.items()]):
            res+=f'<tr><td>{n}</td><td><a href="/{name}.html"><img src="/{name}.thumb.png"></a></td></tr>\n'
        res+="</table></body></html>"
        return res
    def render_idlist(self):
        cherrypy.response.headers['Content-Type'] = "application/json"
        all_ids = [v[1] for v in sorted([(v, k) for k, v  in self.image_names_to_idx.items()])]
        return str.encode(json.dumps(all_ids))


    @cherrypy.popargs('url_path')
    def GET(self, url_path=""):
        #print("GETTING:",repr(url_path))
        page_id = url_path.split("/")[-1].split(".")[0]
        if page_id == "page_id_list":
            return self.render_idlist()
        elif url_path.endswith(".thumb.png"):
            if page_id in self.image_names_to_idx:
                return self.render_thumb(page_id)
            else:
                raise cherrypy.HTTPError(404,"Thumb "+repr(page_id)+" not registered")
        elif url_path.endswith(".png"):
            if page_id in self.image_names_to_idx:
                return self.render_page_image(page_id)
            else:
                raise cherrypy.HTTPError(404,"Page "+repr(page_id)+" not registered. "+repr(self.image_names_to_idx))
        elif url_path.endswith(".html"):
            if page_id in self.image_names_to_idx:
                print(f"Serving {self.image_paths[self.image_names_to_idx[page_id]]}", file=sys.stderr)
                return self.render_html(page_id)
            else:
                raise cherrypy.HTTPError(404,"Groundtruth "+repr(page_id)+" not registered")
        elif url_path == "frat_config.json":
            cherrypy.response.headers['Content-Type'] = "application/javascript"
            return str.encode(json.dumps(self.config_dict))
        elif url_path.endswith(".json"):
            if page_id in self.image_names_to_idx:
                return self.render_gt(page_id)
            else:
                raise cherrypy.HTTPError(404,"Groundtruth "+repr(page_id)+" not registered")
        elif url_path == "favicon.ico":
            cherrypy.response.headers['Content-Type'] = "image/gif"
            return base64.decode("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAO")
        elif url_path == "frat_gui.js":
            cherrypy.response.headers['Content-Type'] = "application/javascript"
            return frat_gui_js
        elif url_path=="":
            return self.render_index()
        else:
            raise cherrypy.HTTPError(404,"Resource :"+repr(url_path)+"  id:"+repr(page_id)+" not understood")


    @cherrypy.tools.accept(media='application/json')
    def PUT(self, page_id):
        id_split = tuple(page_id.split("."))
        page_id = id_split[0]
        annotation_path = self.json_paths[self.image_names_to_idx[id_split[0]]]
        auto_annotation_path = self.autojson_paths[self.image_names_to_idx[id_split[0]]]
        #print("PUT:" + repr(page_id))
        cl = cherrypy.request.headers['Content-Length']
        json_string = str(cherrypy.request.body.read(int(cl)),'utf-8')
        json_string = self.unscale_json(json_string)


        img_md5 = page_id.split("/")[-1].split(".")[0]
        json_dict = json.loads(json_string)
        json_dict["img_md5"] = img_md5
        json_string = json.dumps(json_dict)

        if len(id_split) == 2 and id_split[1].lower()=="json": # normal annotation
            try:
                msg = f"{datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}: saving ID{id_split[0]}"
                open(annotation_path, "w").write(json_string)
            except:
                raise
        elif len(id_split) == 3 and id_split[1:] == ("auto", "json"):
            if os.path.exists(annotation_path):
                annotation=open(annotation_path, "r").read()
            else:
                annotation=json_string
                open(annotation_path, "w").write(json_string)
            if os.path.exists(auto_annotation_path):
                auto_annotation=open(auto_annotation_path, "r").read()
            else:
                auto_annotation=annotation
            if auto_annotation!=json_string and annotation!=json_string:
                msg = f"{datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}: autosaving {id_split[0]}"
                open(auto_annotation_path, "w").write(json_string)
            else:
                msg = f"{datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}: not autosaving, all equal!"
        
        else:
            msg = f"{datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}: PUT url:{page_id} could not be understood."
        print(msg)
