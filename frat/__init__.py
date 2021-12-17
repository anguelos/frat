#from .web_server import StringGeneratorWebService, load_thumbd
from .generic_web_server import FratWebServer
from .version import __version__

import pkgutil

frat_gui_js = pkgutil.get_data(__name__, "resources/frat_gui.js").decode("utf-8")
frat_webpage_jinja2 = pkgutil.get_data(__name__, "resources/frat_webpage.jinja2").decode("utf-8")
