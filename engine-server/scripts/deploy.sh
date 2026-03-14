#!/bin/bash
# デプロイ更新スクリプト
set -e
echo "=== Deploying Engine Update ==="
git pull origin main
docker compose build engine
docker compose up -d engine
echo "=== Deploy Complete ==="
docker compose logs -f engine --tail=20
