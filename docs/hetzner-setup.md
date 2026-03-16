# Hetzner VPS Setup Guide

## Server Details

| Item       | Value                                  |
|------------|----------------------------------------|
| Provider   | Hetzner                                |
| Type       | CPX32                                  |
| IP         | 77.42.32.52                            |
| Specs      | 4 vCPU, 8GB RAM, 160GB SSD            |
| Location   | Helsinki, Finland (hel1-dc2)           |
| OS         | Ubuntu (Hetzner default)               |
| GPU        | None (Ollama runs CPU-only)            |

## Quick Deploy (from local machine)

```bash
# One-command deploy
./scripts/deploy-hetzner.sh
```

This will rsync files and run the setup script on the server.

## Manual Setup

### 1. SSH into Server

```bash
ssh root@77.42.32.52
```

### 2. Clone or Sync Repo

Option A — rsync from local:
```bash
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ./ root@77.42.32.52:/opt/presencevision/
```

Option B — git clone on server:
```bash
cd /opt
git clone https://github.com/your-org/presencevision.git
cd presencevision
```

### 3. Run Setup Script

```bash
cd /opt/presencevision
chmod +x engine-server/scripts/setup.sh
bash engine-server/scripts/setup.sh
```

The setup script will:
- Configure 4GB swap (improves Ollama stability on 8GB RAM)
- Set up firewall (ufw): ports 22, 80, 443
- Install Docker and Docker Compose
- Generate secrets in `.env`
- Start all services
- Pull the Ollama model (`qwen2.5:7b`)

### 4. Set Up Domain DNS

Create an A record pointing to the server:

```
A   your-domain.com       -> 77.42.32.52
A   engine.your-domain.com -> 77.42.32.52
```

Wait for DNS propagation (typically 5-30 minutes).

### 5. SSL (Auto-configured)

SSL is handled by certbot. Set these in `.env` before running setup:

```
DOMAIN=your-domain.com
CERTBOT_EMAIL=your-email@example.com
```

Certbot will auto-renew certificates every 12 hours.

## Firewall Rules

The setup script configures ufw automatically. If you need to manage manually:

```bash
# Check status
ufw status

# Required rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (certbot + redirect)
ufw allow 443/tcp   # HTTPS

# Enable
ufw enable
```

**Do not** expose port 4000 (engine) or 5432 (postgres) directly. Nginx proxies engine traffic via port 80/443.

## Resource Allocation

Optimized for CPX32 (4 vCPU, 8GB RAM):

| Service    | CPU Limit | Memory Limit |
|------------|-----------|--------------|
| PostgreSQL | 0.5 vCPU  | 1 GB         |
| Ollama     | 2.0 vCPU  | 4 GB         |
| Engine     | 1.5 vCPU  | 2 GB         |
| Nginx      | 0.25 vCPU | 256 MB       |

4GB swap is configured for overflow when Ollama is under heavy load.

## Useful Commands

```bash
# Service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs engine

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart a single service
docker compose -f docker-compose.prod.yml restart engine

# Check Ollama models
docker compose -f docker-compose.prod.yml exec ollama ollama list

# Health check
curl http://77.42.32.52:4000/health
```

## Troubleshooting

**Ollama out of memory**: The 4GB swap should help, but if issues persist, try a smaller model:
```bash
# In .env, change OLLAMA_MODEL:
OLLAMA_MODEL=qwen2.5:3b
docker compose -f docker-compose.prod.yml restart ollama
docker compose -f docker-compose.prod.yml exec ollama ollama pull qwen2.5:3b
```

**Engine not starting**: Check logs and ensure PostgreSQL and Ollama are healthy first:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs engine
```

**SSL not working**: Ensure DNS is pointed to 77.42.32.52 and ports 80/443 are open, then re-run certbot:
```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot -d your-domain.com
```
