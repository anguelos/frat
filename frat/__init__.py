from .web_server import StringGeneratorWebService, load_thumbd

import pkgutil

grouting_js_jinja2 = pkgutil.get_data(__name__, "resources/grouting.js").decode("utf-8")
grouting_jinja2 = pkgutil.get_data(__name__, "resources/grouting_webpage.jinja2").decode("utf-8")
