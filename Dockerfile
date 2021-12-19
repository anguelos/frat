FROM ocrd/all

LABEL version="2.0.1"

WORKDIR /opt/frat

COPY . .

EXPOSE 8080

#ENV PYTHONPATH=/opt/frat/

RUN python3 setup.py install

#CMD ["fratv2", "-images","/opt/frat/sample_data/multifont1.png"]
CMD ["/bin/sh", "-c", "fratv2 -images /opt/frat/sample_data/*.png"]