#!/bin/bash

docker compose --env-file .env.server -f docker-compose-server.yml down
set -a
source .env.dev
set +a
echo "start LIBS build $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION"
docker build -t $DOCKERNAME/buildstage:$VERSION -f customer_lib/docker_image_maker .
docker build --build-arg DOCKERNAME=$DOCKERNAME \
  --build-arg VERSION=$VERSION \
  -t $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION \
  -f customer_lib/dockerfile .
  
bash ./deploy.sh
