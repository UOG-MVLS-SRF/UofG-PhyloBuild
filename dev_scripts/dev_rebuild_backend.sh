#!/bin/bash

docker compose --env-file .env.server -f docker-compose-server.yml down
set -a
source .env.dev
set +a
echo "start MAIN build $DOCKERNAME/$MAINNAME:$VERSION"
docker build -t $DOCKERNAME/$MAINNAME:$VERSION -f bioinformatics_tool/dockerfile .
bash ./deploy.sh
