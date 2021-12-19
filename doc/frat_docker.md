
Reset All Docker:
```bash
docker system prune -a
```

Create Docker Image and pushit as testing:
```bash
sudo docker login
sudo docker build  -t anguelos/frat .
sudo docker tag anguelos/frat:latest  anguelos/frat:testing
sudo docker push anguelos/frat:testing
```

Run Image in Docker with Direcory Bind:
```bash
docker  run --network host -v $(pwd)/sample_data:/opt/frat/sample_data anguelos/frat
```