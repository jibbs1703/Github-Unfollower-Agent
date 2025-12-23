# GitHub Unfollower Agent

## Overview

GitHub Unfollower Agent is an AI-powered web application built with FastAPI and LangChain 
that interprets natural language instructions to manage your GitHub social connections.
It leverages Ollama for local LLM inference and uses Qdrant vector database for efficient
data storage and retrieval. The service is designed to be deployed on AWS EC2 for public
access.

## Tech Stack

- **AWS EC2**: Cloud hosting infrastructure
- **Docker**: Containerization for easy and reproducible deployment
- **FastAPI**: Modern Python web framework for the REST API
- **GitHub API**: For fetching and managing follower/following data
- **LangChain**: Agent framework for orchestrating LLM interactions and tool usage
- **Nginx**: Reverse proxy and SSL termination
- **Ollama**: Local LLM inference for processing natural language commands
- **Qdrant**: Vector database for storing and querying session data