#!/bin/bash

docker compose --env-file .env.server -f docker-compose-server.yml down
set -a
source .env.dev
set +a
echo "start FRONTEND build $DOCKERNAME/$FRONTENDNAME:$VERSION"
docker build -t $DOCKERNAME/$FRONTENDNAME:$VERSION -f bioinformatics_tool_frontend/dockerfile --build-arg REACT_APP_API_ENDPOINT="$REACT_APP_API_ENDPOINT" .
bash ./deploy.sh
