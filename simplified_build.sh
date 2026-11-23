#!/bin/bash
echo "Start load env files. The output may raise error or warning, if vital the program shall auto terminated."
set -a
source .env.dev
set +a

# Check if DOCKERNAME, PROJECTNAME, or VERSION is unset or empty
if [ -z "$DOCKERNAME" ] || [ -z "$VERSION" ]; then
    echo "Error: DOCKERNAME and VERSION must be set."
    exit 1
fi

echo "start MAIN build $DOCKERNAME/$MAINNAME:$VERSION"
docker build -t $DOCKERNAME/$MAINNAME:$VERSION -f bioinformatics_tool/dockerfile .

# Push the MAIN docker image
docker push $DOCKERNAME/$MAINNAME:$VERSION
docker tag $DOCKERNAME/$MAINNAME:$VERSION ptree_main:latest

echo "start FRONTEND build $DOCKERNAME/$FRONTENDNAME:$VERSION"
docker build -t $DOCKERNAME/$FRONTENDNAME:$VERSION -f bioinformatics_tool_frontend/dockerfile --build-arg REACT_APP_API_ENDPOINT="$REACT_APP_API_ENDPOINT" .

# Push the FRONTEND docker image
docker push $DOCKERNAME/$FRONTENDNAME:$VERSION
docker tag $DOCKERNAME/$FRONTENDNAME:$VERSION ptree_frontend:latest

echo "start LIBS build $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION"
docker build -t $DOCKERNAME/buildstage:$VERSION -f customer_lib/docker_image_maker .
docker build --build-arg DOCKERNAME=$DOCKERNAME \
  --build-arg VERSION=$VERSION \
  -t $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION \
  -f customer_lib/dockerfile .

# Push the CUSTOMER LIB docker image
docker push $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION
docker tag $DOCKERNAME/$CUSTOMERLIBNAME:$VERSION ptree_customerlib:latest

