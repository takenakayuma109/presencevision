#!/bin/bash
# VPS初期セットアップスクリプト
set -e

echo "=== PresenceVision Engine Setup ==="

# Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# .envファイル生成
if [ ! -f .env ]; then
    echo "Creating .env file..."
    ENGINE_API_KEY=$(openssl rand -hex 32)
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    cat > .env << EOF
ENGINE_API_KEY=$ENGINE_API_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
FRONTEND_URL=https://presencevision-rho.vercel.app
OLLAMA_MODEL=llama3.1
BROWSER_CONCURRENCY=5
ENGINE_CYCLE_INTERVAL_MS=21600000
EOF
    echo "Generated .env with API key: $ENGINE_API_KEY"
    echo "IMPORTANT: Add this API key to your Vercel environment variables as NEXT_PUBLIC_ENGINE_API_KEY"
fi

# Start services
echo "Starting services..."
docker compose up -d

# Wait for Ollama and pull model
echo "Waiting for Ollama to start..."
sleep 10
echo "Pulling LLM model (this may take a while)..."
docker compose exec ollama ollama pull llama3.1

echo ""
echo "=== Setup Complete ==="
echo "Engine URL: http://$(hostname -I | awk '{print $1}'):4000"
echo "Health check: http://$(hostname -I | awk '{print $1}'):4000/health"
echo ""
echo "Next steps:"
echo "1. Set NEXT_PUBLIC_ENGINE_URL in Vercel to: http://YOUR_VPS_IP:4000"
echo "2. Set NEXT_PUBLIC_ENGINE_API_KEY in Vercel to the key shown above"
