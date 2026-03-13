## (F)ast (R)ectangle (A)nnotation (T)ool
#### When rectangles are enough!

[![Documentation build status]https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)


Relevant Resources:
[Multifont OCR-D](https://ocr-d.de/en/gt-guidelines/trans/lySchriftarten.html)


#### Windows Deployment
FRAT can run in windows under docker.
1. Install [Docker Desktop](https://docs.docker.com/desktop/windows/install/) [download](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe) 
2. [Install Windows Linux package](https://docs.microsoft.com/de-de/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package) specifically download and run the MSI file.

3. Run docker by binding the current windows directory to where frat looks for images
Powershell:
```bash
docker  run --network host -v ${pwd}/sample_data:/opt/frat/sample_data anguelos/frat frat -images /opt/frat/sample_data/*
```

cmd:
```bash
docker  run --network host -v  %cd%/sample_data:/opt/frat/sample_data anguelos/frat
```


cmd
```bash

```

#### Development Installation

Requires Python 3 and Node.js. The JavaScript frontend is authored as ES modules and bundled with esbuild.

```bash
make install
```

This runs `npm install && npm run build` to bundle the JS, then `pip install -e .` for the Python package.

To rebuild the JS after editing files under `frat/resources/src/`:
```bash
make build
```
