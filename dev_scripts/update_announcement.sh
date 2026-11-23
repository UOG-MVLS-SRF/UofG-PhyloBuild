#!/bin/bash

# Updates the current announcement on either production or devserver.
#
# Usage:
#	./update_announcement.sh production "Announcement text"
#	./update_announcement.sh devserver "Announcement text"

FILE="/usr/share/nginx/html/current_announcement.txt"

if [ "$#" -lt 2 ]; then
	echo "Usage: $0 <production|devserver> \"Announcement text\""
	exit 1
fi

TARGET="$1"
ANNOUNCEMENT="$2"

case "$TARGET" in
	production)
		PROJECT="phylobuild-2026"
		COMPOSE_FILE="/home/PhyloBuild/PhyloBuild-2026/docker-compose-server.yml"
		ENV_FILE="/home/PhyloBuild/PhyloBuild-2026/.env.server"
		;;
	devserver)
		PROJECT="devserver"
		COMPOSE_FILE="/home/PhyloBuild/dev/PhyloBuild-2026/docker-compose-devserver.yml"
		ENV_FILE="/home/PhyloBuild/dev/PhyloBuild-2026/.env.server"
		;;
	*)
		echo "Error: target must be 'production' or 'devserver'"
		exit 1
		;;
esac

COMPOSE="docker compose -p $PROJECT --env-file $ENV_FILE -f $COMPOSE_FILE"

$COMPOSE exec -T frontend sh -c "printf '%s\n' \"\$1\" > '$FILE'" sh "$ANNOUNCEMENT"

echo "Announcement updated on $TARGET:"
$COMPOSE exec -T frontend cat "$FILE"