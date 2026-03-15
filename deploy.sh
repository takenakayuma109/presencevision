#!/bin/bash
set -e

# PresenceVision Engine — VPS デプロイスクリプト
# Usage: ./deploy.sh <VPS_HOST> [SSH_USER]
# Example: ./deploy.sh 123.45.67.89 root

VPS_HOST="${1:?Usage: ./deploy.sh <VPS_HOST> [SSH_USER]}"
SSH_USER="${2:-root}"
REMOTE_DIR="/opt/presencevision"

echo "=== PresenceVision Engine Deploy ==="
echo "Host: ${SSH_USER}@${VPS_HOST}"
echo "Remote: ${REMOTE_DIR}"
echo ""

# 1. 必要なファイルをVPSに転送
echo "[1/4] Syncing engine files to VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'engine-server/node_modules' \
  ./engine-server/ \
  ./docker-compose.yml \
  ./setup-vps.sh \
  "${SSH_USER}@${VPS_HOST}:${REMOTE_DIR}/"

# engine-serverをサブディレクトリに配置
ssh "${SSH_USER}@${VPS_HOST}" "
  mkdir -p ${REMOTE_DIR}/engine-server
  cd ${REMOTE_DIR}
  # docker-compose.ymlとsetup-vps.shをルートに
  # engine-server関連ファイルをサブディレクトリに
  if [ -f ${REMOTE_DIR}/package.json ]; then
    mv ${REMOTE_DIR}/package.json ${REMOTE_DIR}/engine-server/ 2>/dev/null || true
    mv ${REMOTE_DIR}/src ${REMOTE_DIR}/engine-server/ 2>/dev/null || true
    mv ${REMOTE_DIR}/tsconfig.json ${REMOTE_DIR}/engine-server/ 2>/dev/null || true
    mv ${REMOTE_DIR}/Dockerfile ${REMOTE_DIR}/engine-server/ 2>/dev/null || true
  fi
"

echo ""
echo "[2/4] Running setup on VPS (Docker, Ollama model)..."
ssh "${SSH_USER}@${VPS_HOST}" "chmod +x ${REMOTE_DIR}/setup-vps.sh && ${REMOTE_DIR}/setup-vps.sh"

echo ""
echo "[3/4] Starting services with docker-compose..."
ssh "${SSH_USER}@${VPS_HOST}" "cd ${REMOTE_DIR} && docker compose up -d --build"

echo ""
echo "[4/4] Pulling Ollama model (this may take a few minutes)..."
ssh "${SSH_USER}@${VPS_HOST}" "docker exec \$(docker ps -qf name=ollama) ollama pull llama3.1 || echo 'Model pull will continue in background'"

echo ""
echo "=== Deploy Complete ==="
echo "Engine: http://${VPS_HOST}:4000"
echo "Ollama: http://${VPS_HOST}:11434"
echo ""
echo "Check status: ssh ${SSH_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose ps'"
echo "View logs:    ssh ${SSH_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose logs -f engine'"
