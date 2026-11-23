#!/bin/bash

set -a
source /container.env
set +a
echo "ready to call scheduled_analysis"
/usr/local/bin/python3 /app/manage.py scheduled_analysis
