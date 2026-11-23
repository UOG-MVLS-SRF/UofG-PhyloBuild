#!/bin/bash

docker login -u your-registry-username -p your-registry-password
docker-compose pull
docker-compose -f docker-compose-server.yml up -d