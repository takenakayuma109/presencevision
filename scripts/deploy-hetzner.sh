#!/bin/bash
# Deploy PresenceVision to Hetzner VPS
# Server: Hetzner CPX32 (4 vCPU, 8GB RAM, 160GB SSD)
# IP: 77.42.32.52 (Helsinki, Finland — hel1-dc2)
#
# Usage: ./scripts/deploy-hetzner.sh
# Run from the project root on your LOCAL machine.
set -euo pipefail

SERVER="root@77.42.32.52"
REMOTE_DIR="/opt/presencevision"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; exit 1; }

echo ""
echo "============================================"
echo "  Deploy to Hetzner VPS (77.42.32.52)"
echo "============================================"
echo ""

# --------------------------------------------------------------------------
# 1. Pre-flight checks
# --------------------------------------------------------------------------
info "Checking SSH connectivity..."
ssh -o ConnectTimeout=5 -o BatchMode=yes "${SERVER}" "echo ok" > /dev/null 2>&1 || {
    error "Cannot connect to ${SERVER}. Check SSH key and server status."
}
info "SSH connection OK."

# --------------------------------------------------------------------------
# 2. Ensure remote directory exists
# --------------------------------------------------------------------------
info "Ensuring remote directory exists..."
ssh "${SERVER}" "mkdir -p ${REMOTE_DIR}"

# --------------------------------------------------------------------------
# 3. Sync project files
# --------------------------------------------------------------------------
info "Syncing project files to ${SERVER}:${REMOTE_DIR}..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude 'dist' \
    --exclude '.turbo' \
    --exclude 'coverage' \
    ./ "${SERVER}:${REMOTE_DIR}/"

info "Files synced."

# --------------------------------------------------------------------------
# 4. Run setup on server
# --------------------------------------------------------------------------
info "Running setup script on server..."
ssh "${SERVER}" "cd ${REMOTE_DIR} && chmod +x engine-server/scripts/setup.sh && bash engine-server/scripts/setup.sh"

# --------------------------------------------------------------------------
# 5. Verify deployment
# --------------------------------------------------------------------------
echo ""
info "Verifying deployment..."
sleep 10

if ssh "${SERVER}" "curl -sf http://localhost:4000/health" > /dev/null 2>&1; then
    info "Engine health check: OK"
else
    warn "Engine may still be starting. Check manually:"
    warn "  ssh ${SERVER} 'docker compose -f ${REMOTE_DIR}/docker-compose.prod.yml logs engine'"
fi

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
echo ""
echo "  Engine API:    http://77.42.32.52:4000"
echo "  Engine Health: http://77.42.32.52:4000/health"
echo ""
echo "  SSH into server: ssh ${SERVER}"
echo "  View logs:       ssh ${SERVER} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f'"
echo ""
