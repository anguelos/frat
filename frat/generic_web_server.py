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
import fargv
import sys
import os
import io
from PIL import Image
from cherrypy.lib import file_generator

#grouting_js = pkgutil.get_data(__name__, "resources/grouting.js").decode("utf-8")
#grouting_jinja2 = pkgutil.get_data(__name__, "resources/grouting_webpage.jinja2").decode("utf-8")

frat_gui_js = pkgutil.get_data(__name__, "resources/frat_gui.js").decode("utf-8").encode('utf8')
frat_webpage_jinja2 = pkgutil.get_data(__name__, "resources/frat_webpage.jinja2").decode("utf-8")
empty_page_json = pkgutil.get_data(__name__, "resources/empty_page.json").decode("utf-8")


def create_thumb(fname, format="png", width=100, height=-1):
    img = Image.open(fname)
    print("1Thumb size ",img.size)
    if height<0:
        old_width, old_height = img.size
        height = int((old_height/old_width)*width)
    img = img.resize((width, height))
    with io.BytesIO() as output:
        print("2Thumb size ",img.size)
        img.save(output, format=format)
        return output.getvalue()


@cherrypy.expose
class FratWebServer(object):
    def __init__(self, image_filenames, image_web_format="png", html_template=None) -> None:
        super().__init__()
        if html_template == None:
            self.html_template = jinja2.Template(frat_webpage_jinja2)
        else:
            self.html_template = jinja2.Template(html_template)
        self.image_web_format = image_web_format
        self.thumbs = []
        self.image_names_to_idx = {}
        self.image_paths = []
        self.json_paths = []
        for n, image_filename in enumerate(tqdm.tqdm(image_filenames, desc="Creating thumbs")):
            self.thumbs.append(create_thumb(image_filename))
            self.image_paths.append(image_filename)
            self.json_paths.append(image_filename+".json")
            self.image_names_to_idx[str(zlib.crc32(self.thumbs[-1]))] = n


    def render_page_image(self, image_id):
        img_path = self.image_paths[self.image_names_to_idx[image_id]]
        img = Image.open(img_path)
        cherrypy.response.headers['Content-Type'] = f"image/{self.image_web_format}"
        with io.BytesIO() as output:
            img.save(output, format=self.image_web_format)
            return output.getvalue()
    
    def render_thumb(self, image_id):
        cherrypy.response.headers['Content-Type'] = f"image/{self.image_web_format}"
        return self.thumbs[self.image_names_to_idx[image_id]]
    
    def render_gt(self, image_id):
        cherrypy.response.headers['Content-Type'] = "application/json"
        json_path = self.json_paths[self.image_names_to_idx[image_id]]
        if(os.path.exists(json_path)):
            return open(json_path,"r").read().encode('utf8')
        else:
            return empty_page_json.encode("utf8")

    def render_html(self, image_id):
        cherrypy.response.headers['Content-Type'] = "text/html"
        return self.html_template.render(id=image_id)

    def render_index(self):
        cherrypy.response.headers['Content-Type'] = "text/html"
        res="<html><body><table>"
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
        print("GETTING:",repr(url_path))
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
                return self.render_html(page_id)
            else:
                raise cherrypy.HTTPError(404,"Groundtruth "+repr(page_id)+" not registered")

        elif url_path.endswith(".json"):
            if page_id in self.image_names_to_idx:
                return self.render_gt(page_id)
            else:
                raise cherrypy.HTTPError(404,"Groundtruth "+repr(page_id)+" not registered")
        if url_path == "favicon.ico":
            cherrypy.response.headers['Content-Type'] = "image/gif"
            return base64.decode("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAO")
        if url_path == "frat_gui.js":
            cherrypy.response.headers['Content-Type'] = "application/javascript"
            return frat_gui_js

        elif url_path=="":
            return self.render_index()
        else:
            raise cherrypy.HTTPError(404,"Resource :"+repr(url_path)+"  id:"+repr(page_id)+" not understood")

    @cherrypy.tools.accept(media='application/json')
    def PUT(self, url_path):
        page_id = url_path.split("/")[-1].split(".")[0]
        print("PUT:" + repr(url_path))
        cl = cherrypy.request.headers['Content-Length']
        json_string = cherrypy.request.body.read(int(cl))
        try:
            print("ID:", page_id)
            print("fname=", self.json_paths[self.image_names_to_idx[page_id]])
            print("json_str:", repr(json_string))
            open(self.json_paths[self.image_names_to_idx[page_id]], "w").write(json_string.decode("utf-8"))
        except:
            raise


@cherrypy.expose
class StringGeneratorWebService(object):
    def __init__(self, image_list, annotator_template):
        id_paths = [(hashlib.md5(open(img, "rb").read()).hexdigest(), img) for img in image_list]
        self.ids = [id_path[0] for id_path in id_paths]
        self.previous_id = {self.ids[k]: self.ids[k - 1] for k in range(1, len(self.ids))}
        self.previous_id[self.ids[0]] = ""
        self.next_id = {self.ids[k - 1]: self.ids[k] for k in range(1, len(self.ids))}
        self.next_id[self.ids[-1]] = ""
        self.id2image_fnames = dict(id_paths)
        self.id2thumbs = {id: load_thumbd(fname) for id, fname in tqdm.tqdm(self.id2image_fnames.items())}
        self.id2json_fnames = {k: v[:v.rfind(".")] + ".json" for k, v in self.id2image_fnames.items()}
        # self.json_list=[p[:p.rfind(".")]+".json" for p in image_list]
        self.annotator = jinja2.Template(annotator_template)

    @cherrypy.popargs('id')
    def GET(self, page_id=""):
        if not page_id:
            # return all items
            cherrypy.response.headers['Content-Type'] = 'text/html'
            head = "<html><body><table><tr><td>\n"
            tail = "\n</td></tr></html></body></html>\n"
            body = "</td></tr>\n<tr><td>".join(
                [f'{k}</td><td><a href="{v}"><img src="{v}.thumb.jpg"/></a>' for k, v in enumerate(self.ids)])
            return head + body + tail
        else:
            print("LINE50 id:", page_id)
            id_split = page_id.split(".")
            if page_id == "favicon.ico":
                cherrypy.response.headers['Content-Type'] = "image/gif"
                # return atob("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAO")
                return base64.decode("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAO")
            elif page_id == "grouting.js":
                cherrypy.response.headers['Content-Type'] = 'application/javascript'
                return grouting_js
            elif len(id_split) == 1:
                cherrypy.response.headers['Content-Type'] = 'text/html'
                page_id = id_split[0]
                return self.annotator.render(page_id=page_id, previous_id=self.previous_id[page_id], next_id=self.next_id[page_id])
            elif id_split[-1] == "jpg":
                if id_split[-2] == "thumb":
                    print("Returning thumbs", id_split[0])
                    cherrypy.response.headers['Content-Type'] = "image/jpg"
                    print("Type:", type(self.id2thumbs[id_split[0]]), "  sz:", len(self.id2thumbs[id_split[0]]))
                    return self.id2thumbs[id_split[0]]
                else:
                    print("Returning image", id_split[0])
                    cherrypy.response.headers['Content-Type'] = "image/jpg"
                    return open(self.id2image_fnames[id_split[0]], "rb").read()
            elif id_split[1] == "json":
                cherrypy.response.headers['Content-Type'] = 'application/json'
                try:
                    json_str = open(self.id2json_fnames[id_split[0]]).read()
                    print("Returning real json:", json_str)
                    return json_str
                except IOError:  # for python3 FileNotFoundError:
                    print("Returning fake json.")
                    return json.dumps({"rectangles_ltrb": [], "captions": []})
            else:
                print("id:", page_id)
                raise

    def POST(self, length=8):
        some_string = ''.join(random.sample(string.hexdigits, int(length)))
        cherrypy.session['mystring'] = some_string
        return some_string

    @cherrypy.tools.accept(media='application/json')
    def PUT(self, page_id):
        id_split = page_id.split(".")
        print("PUT:" + repr(page_id))
        cl = cherrypy.request.headers['Content-Length']
        json_string = cherrypy.request.body.read(int(cl))
        try:
            print("ID:", id_split[0])
            print("json fname", self.id2json_fnames)
            print("fname=", self.id2json_fnames[id_split[0]])
            print("json_str:", repr(json_string))
            open(self.json_paths[self.image_names_to_idx[id_split[0]]], "w").write(json_string)
        except:
            raise

    def DELETE(self):
        cherrypy.session.pop('mystring', None)
