#!/bin/bash
set -e

# PresenceVision — VPS初期セットアップ
# Docker + Docker Compose をインストール

echo "=== VPS Setup for PresenceVision Engine ==="

# Docker がなければインストール
if ! command -v docker &> /dev/null; then
  echo "[+] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker installed."
else
  echo "[✓] Docker already installed."
fi

# Docker Compose (v2 plugin)
if ! docker compose version &> /dev/null; then
  echo "[+] Installing Docker Compose plugin..."
  apt-get update && apt-get install -y docker-compose-plugin
  echo "Docker Compose installed."
else
  echo "[✓] Docker Compose already installed."
fi

# .env ファイルがなければ作成
REMOTE_DIR="/opt/presencevision"
if [ ! -f "${REMOTE_DIR}/.env" ]; then
  echo "[+] Creating .env file..."
  cat > "${REMOTE_DIR}/.env" << 'ENVEOF'
# PresenceVision Engine Configuration
ENGINE_API_KEY=pv-engine-secret-change-me
FRONTEND_URL=https://presencevision-rho.vercel.app
OLLAMA_MODEL=llama3.1
BROWSER_CONCURRENCY=5
ENGINE_CYCLE_INTERVAL_MS=21600000
POSTGRES_PASSWORD=presencevision-secure-pw
ENVEOF
  echo ".env created at ${REMOTE_DIR}/.env"
  echo "⚠ Edit ENGINE_API_KEY and POSTGRES_PASSWORD before production use!"
else
  echo "[✓] .env already exists."
fi

# GPU check (for Ollama performance)
if command -v nvidia-smi &> /dev/null; then
  echo "[✓] NVIDIA GPU detected — Ollama will use GPU acceleration."
else
  echo "[!] No GPU detected — Ollama will run on CPU (slower but works)."
  # GPU がない場合、docker-compose の GPU 設定を無効化
  if [ -f "${REMOTE_DIR}/docker-compose.yml" ]; then
    sed -i '/deploy:/,/count: all/d' "${REMOTE_DIR}/docker-compose.yml" 2>/dev/null || true
    echo "    GPU settings removed from docker-compose.yml"
  fi
fi

echo ""
echo "=== Setup Complete ==="
echo "Next: docker compose up -d --build"
