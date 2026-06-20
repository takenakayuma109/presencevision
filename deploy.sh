#!/bin/bash
set -e

# PresenceVision Engine — VPS デプロイスクリプト
# Usage: ./deploy.sh <VPS_HOST> [SSH_USER]
# Example: ./deploy.sh 123.45.67.89 root

VPS_HOST="${1:?Usage: ./deploy.sh <VPS_HOST> [SSH_USER]}"
SSH_USER="${2:-root}"
REMOTE_DIR="/opt/presencevision"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== PresenceVision Production Deploy ==="
echo "Host: ${SSH_USER}@${VPS_HOST}"
echo "Remote: ${REMOTE_DIR}"
echo ""

# 1. 必要なファイルをVPSに転送
echo "[1/5] Syncing files to VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'engine-server/node_modules' \
  ./engine-server \
  ./docker-compose.prod.yml \
  ./docker-compose.yml \
  ./.env.production.example \
  ./setup-vps.sh \
  ./nginx/ \
  ./prisma/ \
  "${SSH_USER}@${VPS_HOST}:${REMOTE_DIR}/"

# engine-server は rsync で ${REMOTE_DIR}/engine-server/ サブディレクトリとして転送済み。
# （以前は './engine-server/' のトレイリングスラッシュでREMOTE_DIR直下に展開し、
#   再デプロイ時に mv が "Directory not empty" で失敗→新コードが /opt/.../src に迷子→
#   旧コードのままイメージがビルドされていた）
ssh "${SSH_USER}@${VPS_HOST}" "mkdir -p ${REMOTE_DIR}/nginx ${REMOTE_DIR}/prisma"

echo ""
echo "[2/5] Running setup on VPS (Docker check)..."
ssh "${SSH_USER}@${VPS_HOST}" "chmod +x ${REMOTE_DIR}/setup-vps.sh && ${REMOTE_DIR}/setup-vps.sh"

echo ""
echo "[3/5] Running production setup..."
ssh "${SSH_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && chmod +x engine-server/scripts/setup.sh && bash engine-server/scripts/setup.sh"

echo ""
echo "[3.5/5] Rebuilding engine image with latest code (COPY方式のため明示再ビルド必須)..."
ssh "${SSH_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} build engine && docker compose -f ${COMPOSE_FILE} up -d --force-recreate engine"

echo ""
echo "[4/5] Verifying services..."
ssh "${SSH_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} ps"

echo ""
echo "[5/5] Running health checks..."
ssh "${SSH_USER}@${VPS_HOST}" "curl -sf http://localhost:4000/health || echo 'Engine health check pending...'"

echo ""
echo "=== Deploy Complete ==="
echo "Engine:  http://${VPS_HOST}:4000"
echo "Health:  http://${VPS_HOST}:4000/health"
echo "HTTPS:   https://${VPS_HOST} (if SSL configured)"
echo ""
echo "Check status: ssh ${SSH_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} ps'"
echo "View logs:    ssh ${SSH_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} logs -f engine'"
