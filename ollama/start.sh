#!/bin/sh
MODEL_NAME="llama3.1:8B"

ollama serve &
sleep 10
ollama pull $MODEL_NAME
tail -f /dev/null
