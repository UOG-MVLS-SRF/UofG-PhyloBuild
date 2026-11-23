#!/bin/bash
# PhyloBuild deploy / boot script for the Glasgow VM.
# Runs the production stack from the pre-built images shipped from the laptop
# (loads phylo_images.tar.gz if present) and works around the two recurring startup
# quirks (leftover custom_lib container, and web starting before db).
#
# Usage:   ./deploy.sh
# On boot: add to crontab as  @reboot /path/to/deploy.sh >> /path/to/deploy.log 2>&1
source .env.server

cd "$(dirname "$0")"

# Use compose v2 if available, else fall back to v1.
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose -p devserver --env-file .env.server -f docker-compose-devserver.yml"
else
  COMPOSE="docker-compose -p devserver --env-file .env.server -f docker-compose-devserver.yml"
fi

if [ -z "$DOCKERNAME" ] || [ -z "$DOCKERPASS" ]; then
    echo "Error: Docker variables not set in .env.server. Please ensure username (DOCKERNAME) and password (DOCKERPASS) are set."
    exit 1
fi

echo "Pulling docker images"

docker login -u $DOCKERNAME -p $DOCKERPASS

echo "[deploy] removing any leftover custom_lib container (recreated outside compose)..."
docker ps -aq --filter "name=devserver-custom_lib" | xargs -r docker rm -f

# No --build: use the loaded images as-is (the VM doesn't rebuild/compile anything).
echo "[deploy] starting the stack from the loaded images..."
$COMPOSE up -d

# web can come up before db is ready on a cold boot; give db a moment and re-run up
echo "[deploy] waiting for db to settle, then reconciling..."
sleep 15
$COMPOSE up -d

echo "Synching available databases"
$COMPOSE exec -T web python manage.py sync_genome_library

echo "[deploy] reloading nginx upstream resolution..."
$COMPOSE exec -T frontend nginx -s reload

echo "[deploy] current state:"
$COMPOSE ps
echo "[deploy] done. Visit http://phylotree.srf.gla.ac.uk (once DNS/firewall/TLS are in place)."

