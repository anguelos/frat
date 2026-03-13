#!/usr/bin/env python3
"""Starts the FRAT server on port 8181 using sample_data images, for Playwright tests.
Expected to be launched from the project root (as configured in playwright.config.js)."""
import sys
import glob
import cherrypy
from frat import FratWebServer
import frat

images = sorted(glob.glob('sample_data/*.jpg') + glob.glob('sample_data/*.png'))
assert images, "No images found in sample_data/ — run tests from the project root"

conf = {
    '/': {
        'log.screen': False,
        'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        'tools.sessions.on': True,
        'tools.response_headers.on': True,
        'tools.response_headers.headers': [('Content-Type', 'text/plain')],
    }
}

cherrypy.server.socket_port = 8181
cherrypy.quickstart(FratWebServer(images, config_dict=frat.frat_gui_config_illuminated), '/', conf)
