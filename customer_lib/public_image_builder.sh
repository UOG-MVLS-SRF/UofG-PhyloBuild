#!/bin/bash
echo "Start load env files. The output may raise error or warning, if vital the program shall auto terminated."
source ../.env.dev

# Check if DOCKERNAME, PROJECTNAME, or VERSION is unset or empty
if [ -z "$DOCKERNAME" ] || [ -z "$PROJECTNAME" ] || [ -z "$VERSION" ]; then
    echo "Error: DOCKERNAME, PROJECTNAME, and VERSION must be set."
    exit 1
fi

echo "start build $DOCKERNAME/$PROJECTNAME:$VERSION"
docker build -t $DOCKERNAME/$PROJECTNAME:$VERSION -f docker_image_maker .

# Push the docker image
docker push $DOCKERNAME/$PROJECTNAME:$VERSION
