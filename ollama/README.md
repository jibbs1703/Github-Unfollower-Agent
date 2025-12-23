# Standalone Ollama Container Setup

This directory contains the Docker configuration for running an Ollama container with a pre-installed model. This setup allows you to run Ollama
in a self-contained environment.

## Prerequisites

- Docker installed on your system
- Sufficient disk space for the model (~4-5 GB)

## Building the Image

Navigate to the `ollama` directory containing the Dockerfile and the docker configuration files, then build the Docker image:

```bash
cd ollama
docker build -t ollama-custom:latest .
```

## Running the Container

Run the container from the built image with the following command:

```bash
docker run -d \
  --name custom-ollama-container \
  -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  ollama-custom:latest
```

## API Usage

Once running, you can interact with Ollama via HTTP API on `http://localhost:11434`.

Example: List available models
```bash
curl http://localhost:11434/api/tags
```

## Stopping the Container

```bash
docker stop custom-ollama-container
```

## Removing the Container

```bash
docker rm custom-ollama-container
```
