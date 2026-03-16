#!/bin/bash
# chmod +x engine-server/scripts/setup.sh
#
# PresenceVision Production Setup Script
# Target: Hetzner CPX32 (4 vCPU, 8GB RAM, 160GB SSD)
# Server IP: 77.42.32.52
# Location: Helsinki, Finland (hel1-dc2)
# OS: Ubuntu (Hetzner default)
#
# Usage: ./engine-server/scripts/setup.sh
# Run from the project root (/opt/presencevision or local checkout).
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_TEMPLATE=".env.production.example"
ENV_FILE=".env"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:7b}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; }

echo ""
echo "============================================"
echo "  PresenceVision Production Setup"
echo "  Hetzner CPX32 — 4 vCPU / 8GB RAM"
echo "============================================"
echo ""

# --------------------------------------------------------------------------
# 0. Hetzner / Ubuntu-specific optimizations
# --------------------------------------------------------------------------
info "Running system-level optimizations..."

# Detect Hetzner (optional — informational only)
if [ -f /sys/class/dmi/id/sys_vendor ] && grep -qi "hetzner" /sys/class/dmi/id/sys_vendor 2>/dev/null; then
    info "Hetzner server detected."
elif [ -f /etc/hetzner ]; then
    info "Hetzner server detected."
else
    warn "Could not confirm Hetzner environment (continuing anyway)."
fi

# Set up swap (4GB) if not already present — helps Ollama on 8GB RAM
if ! swapon --show | grep -q '/swapfile'; then
    info "Setting up 4GB swap..."
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
    fi
    swapon /swapfile
    # Persist across reboots
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    # Optimize swappiness for server workload
    sysctl vm.swappiness=10
    if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
    fi
    info "4GB swap enabled (swappiness=10)."
else
    info "Swap already active."
fi

# Set up firewall (ufw) — allow SSH, HTTP, HTTPS
if command -v ufw &> /dev/null; then
    info "Configuring firewall (ufw)..."
    ufw --force reset > /dev/null 2>&1
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow 22/tcp > /dev/null 2>&1   # SSH
    ufw allow 80/tcp > /dev/null 2>&1   # HTTP
    ufw allow 443/tcp > /dev/null 2>&1  # HTTPS
    ufw --force enable > /dev/null 2>&1
    info "Firewall enabled: SSH(22), HTTP(80), HTTPS(443)."
else
    warn "ufw not found. Installing..."
    apt-get update -qq && apt-get install -y -qq ufw
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow 22/tcp > /dev/null 2>&1
    ufw allow 80/tcp > /dev/null 2>&1
    ufw allow 443/tcp > /dev/null 2>&1
    ufw --force enable > /dev/null 2>&1
    info "Firewall installed and enabled."
fi

# --------------------------------------------------------------------------
# 1. Check Docker
# --------------------------------------------------------------------------
info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    warn "Docker not found. Installing via apt (Ubuntu)..."
    # Install prerequisites
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    # Add Docker GPG key and repo
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    info "Docker installed."
else
    info "Docker already installed: $(docker --version)"
fi

# --------------------------------------------------------------------------
# 2. Check Docker Compose
# --------------------------------------------------------------------------
info "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    warn "Docker Compose plugin not found. Installing..."
    apt-get update -qq && apt-get install -y -qq docker-compose-plugin
    info "Docker Compose installed."
else
    info "Docker Compose available: $(docker compose version --short)"
fi

# --------------------------------------------------------------------------
# 3. Environment file
# --------------------------------------------------------------------------
info "Checking environment file..."
if [ ! -f "${ENV_FILE}" ]; then
    if [ -f "${ENV_TEMPLATE}" ]; then
        cp "${ENV_TEMPLATE}" "${ENV_FILE}"
        # Auto-generate secrets
        GENERATED_ENGINE_KEY=$(openssl rand -hex 32)
        GENERATED_PG_PASSWORD=$(openssl rand -hex 16)
        GENERATED_NEXTAUTH_SECRET=$(openssl rand -base64 32)

        if [[ "$OSTYPE" == "darwin"* ]]; then
            SED_INPLACE="sed -i ''"
        else
            SED_INPLACE="sed -i"
        fi

        $SED_INPLACE "s|ENGINE_API_KEY=generate-random-key|ENGINE_API_KEY=${GENERATED_ENGINE_KEY}|" "${ENV_FILE}"
        $SED_INPLACE "s|POSTGRES_PASSWORD=changeme|POSTGRES_PASSWORD=${GENERATED_PG_PASSWORD}|" "${ENV_FILE}"
        $SED_INPLACE "s|NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32|NEXTAUTH_SECRET=${GENERATED_NEXTAUTH_SECRET}|" "${ENV_FILE}"
        # Update DATABASE_URL with generated password
        $SED_INPLACE "s|postgresql://pvuser:changeme@|postgresql://pvuser:${GENERATED_PG_PASSWORD}@|" "${ENV_FILE}"

        info "Created ${ENV_FILE} from template with auto-generated secrets."
        warn ""
        warn "================================================"
        warn "  IMPORTANT: Edit .env before continuing!"
        warn "  At minimum, set:"
        warn "    - DOMAIN"
        warn "    - CERTBOT_EMAIL"
        warn "    - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET"
        warn "    - Stripe keys (if billing enabled)"
        warn "================================================"
        warn ""
        read -rp "Press Enter after editing .env to continue (or Ctrl+C to abort)..."
    else
        error "${ENV_TEMPLATE} not found. Cannot create .env."
        exit 1
    fi
else
    info ".env already exists. Skipping creation."
fi

# Source env for variable access
set -a
source "${ENV_FILE}"
set +a

# --------------------------------------------------------------------------
# 4. GPU Check — Hetzner CPX32 has no GPU, Ollama will use CPU
# --------------------------------------------------------------------------
if command -v nvidia-smi &> /dev/null; then
    info "NVIDIA GPU detected. Ollama will use GPU acceleration."
else
    info "No GPU detected (expected on Hetzner CPX32). Ollama will run on CPU."
    info "Using CPU-optimized model: ${OLLAMA_MODEL}"
fi

# --------------------------------------------------------------------------
# 5. SSL Certificate (initial)
# --------------------------------------------------------------------------
DOMAIN="${DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [ -n "${DOMAIN}" ] && [ -n "${CERTBOT_EMAIL}" ]; then
    if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        info "Obtaining SSL certificate for ${DOMAIN}..."
        # Start nginx temporarily for ACME challenge
        mkdir -p ./certbot-webroot
        docker run --rm -p 80:80 \
            -v "$(pwd)/certbot-webroot:/var/www/certbot" \
            -v presencevision_certbot-etc:/etc/letsencrypt \
            -v presencevision_certbot-var:/var/lib/letsencrypt \
            certbot/certbot certonly \
            --webroot -w /var/www/certbot \
            --email "${CERTBOT_EMAIL}" \
            --agree-tos --no-eff-email \
            -d "${DOMAIN}" || {
                warn "SSL cert request failed. You can obtain it later with:"
                warn "  docker compose -f ${COMPOSE_FILE} run --rm certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN}"
            }
    else
        info "SSL certificate for ${DOMAIN} already exists."
    fi
else
    warn "DOMAIN or CERTBOT_EMAIL not set. Skipping SSL setup."
    warn "Set them in .env and re-run, or manually configure SSL."
fi

# --------------------------------------------------------------------------
# 6. Start services
# --------------------------------------------------------------------------
info "Starting all services..."
docker compose -f "${COMPOSE_FILE}" up -d --build

# --------------------------------------------------------------------------
# 7. Wait for services and run migrations
# --------------------------------------------------------------------------
info "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U "${POSTGRES_USER:-pvuser}" -d presencevision &> /dev/null; then
        info "PostgreSQL is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        error "PostgreSQL did not become ready in time."
        exit 1
    fi
    sleep 2
done

# Run Prisma migrations if prisma directory exists
if [ -d "prisma" ]; then
    info "Running Prisma migrations..."
    npx prisma migrate deploy 2>/dev/null || warn "Prisma migrate skipped (may not be installed locally). Run inside container if needed."
fi

# --------------------------------------------------------------------------
# 8. Pull Ollama model (CPU-optimized for 8GB RAM)
# --------------------------------------------------------------------------
info "Pulling Ollama model: ${OLLAMA_MODEL}..."
info "(This may take several minutes on first run)"
info "Note: Using ${OLLAMA_MODEL} — optimized for CPU-only on 8GB RAM"
docker compose -f "${COMPOSE_FILE}" exec -T ollama ollama pull "${OLLAMA_MODEL}" || {
    warn "Model pull may still be in progress. Check with:"
    warn "  docker compose -f ${COMPOSE_FILE} exec ollama ollama list"
}

# --------------------------------------------------------------------------
# 9. Health checks
# --------------------------------------------------------------------------
info "Running health checks..."
echo ""

# PostgreSQL
if docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U "${POSTGRES_USER:-pvuser}" -d presencevision &> /dev/null; then
    info "PostgreSQL .......... OK"
else
    error "PostgreSQL .......... FAILED"
fi

# Ollama
if docker compose -f "${COMPOSE_FILE}" exec -T ollama curl -sf http://localhost:11434/api/tags &> /dev/null; then
    info "Ollama .............. OK"
else
    error "Ollama .............. FAILED (may still be starting)"
fi

# Engine
sleep 5
if curl -sf http://localhost:4000/health &> /dev/null; then
    info "Engine Server ....... OK"
else
    warn "Engine Server ....... STARTING (check logs with: docker compose -f ${COMPOSE_FILE} logs engine)"
fi

# Nginx
if curl -sf http://localhost:80 &> /dev/null || curl -sfk https://localhost:443 &> /dev/null; then
    info "Nginx ............... OK"
else
    warn "Nginx ............... CHECK CONFIG (may need SSL cert first)"
fi

# --------------------------------------------------------------------------
# 10. Summary
# --------------------------------------------------------------------------
echo ""
echo "============================================"
echo "  Setup Complete!"
echo "  Server: Hetzner CPX32 — 77.42.32.52"
echo "============================================"
echo ""

VPS_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "77.42.32.52")

info "Service URLs:"
echo "  Engine API:  http://${VPS_IP}:4000"
echo "  Engine Health: http://${VPS_IP}:4000/health"
if [ -n "${DOMAIN}" ]; then
    echo "  HTTPS:       https://${DOMAIN}"
    echo "  Engine via HTTPS: https://${DOMAIN}/api/engine/health"
fi
echo ""
info "Useful commands:"
echo "  docker compose -f ${COMPOSE_FILE} ps          # Service status"
echo "  docker compose -f ${COMPOSE_FILE} logs -f      # All logs"
echo "  docker compose -f ${COMPOSE_FILE} logs engine   # Engine logs"
echo "  docker compose -f ${COMPOSE_FILE} restart       # Restart all"
echo ""
info "Next steps:"
echo "  1. Verify engine health: curl http://${VPS_IP}:4000/health"
echo "  2. Set NEXT_PUBLIC_ENGINE_URL in Vercel environment variables"
echo "  3. Set ENGINE_API_KEY in Vercel (value from .env)"
echo ""
