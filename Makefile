.PHONY: build build-js install

build: build-js

build-js:
	npm install
	npm run build

install: build
	pip install -e .
