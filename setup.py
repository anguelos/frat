#import setuptools
from setuptools import setup, Extension
from distutils.util import convert_path

main_ns = {}
ver_path = convert_path('frat/version.py')
with open(ver_path) as ver_file:
    exec(ver_file.read(), main_ns)

setup(
    name='frat',
    version=main_ns['__version__'],
    packages=['frat'],
    #package_data={'frat': ['resources/diplomatics_annotation_config.json',
    #'frat/resources/font_annotation_config.json', 
    #'frat/resources/frat_webpage.jinja2',
    #'frat/resources/empty_page.json'
    #'frat/resources/frat_gui.js']},
    #include_package_data=True,
    package_data={'frat': ['resources/*.*']},
    scripts=['bin/frat', 'bin/frat_config', 'bin/frat_json2png'],
    license='GPLv3',
    author='Anguelos Nicolaou',
    author_email='anguelos.nicolaou@gmail.com',
    url='https://github.com/anguelos/frat',
    description="Fast Rectangle Annotation Tool",
    long_description_content_type="text/markdown",
    long_description=open('README.md').read(),
    #download_url='https://github.com/anguelos/tormentor/archive/0.1.0.tar.gz',
    keywords=["documents", "groudtruthing", "webbased"],
    classifiers=[
        "Intended Audience :: Science/Research",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Topic :: Scientific/Engineering"],
    install_requires=["Pillow", "jinja2", "cherrypy", "fargv", "tqdm", "opencv-python-headless", "numpy", "opencv-python-headless"],
)