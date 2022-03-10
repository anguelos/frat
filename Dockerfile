FROM ocrd/all

LABEL version="2.0.2"

WORKDIR /opt/frat

COPY . .

EXPOSE 8080

#ENV PYTHONPATH=/opt/frat/

RUN python3 setup.py install

#CMD ["fratv2", "-images","/opt/frat/sample_data/multifont1.png"]
CMD ["/bin/sh", "-c", "frat -images /opt/frat/sample_data/*.tif"]