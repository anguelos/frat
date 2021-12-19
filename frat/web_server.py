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

grouting_js = pkgutil.get_data(__name__, "resources/grouting.js").decode("utf-8")
grouting_jinja2 = pkgutil.get_data(__name__, "resources/grouting_webpage.jinja2").decode("utf-8")


def load_thumbd(fname, width=100):
    img = cv2.imread(fname, cv2.IMREAD_COLOR)
    hw = img.shape[1] / float(img.shape[0]);
    thumb = cv2.resize(img, (int(width), int(width * hw)), interpolation=cv2.INTER_AREA)
    encoded = cv2.imencode(".jpg", thumb)[1].reshape(-1)
    return encoded


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
            open(self.id2json_fnames[id_split[0]], "w").write(json_string)
        except:
            raise

    def DELETE(self):
        cherrypy.session.pop('mystring', None)
