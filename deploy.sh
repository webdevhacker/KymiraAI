#!/bin/bash

# =============================================================================
# KymiraAI — Production Deploy Script
# Usage: bash deploy.sh [--skip-build]
# =============================================================================

set -e

APP_DIR="/var/www/kymiraai.isharankumar.com/"
BRANCH="main"

# Define your NGINX cache path here (if you use one)
NGINX_CACHE_DIR="/var/cache/nginx"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success(){ echo -e "${GREEN}✅ $1${NC}"; }
warn()   { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      KymiraAI Deployment Script      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Check we're in the right directory ──────────────────────────────────────
cd "$APP_DIR" || error "App directory not found: $APP_DIR"

# ── Pull latest code ─────────────────────────────────────────────────────────
log "Pulling latest code from $BRANCH..."
git fetch origin
git reset --hard origin/$BRANCH
success "Code updated"

# ── Install & build backend dependencies ──────────────────────────────────────
log "Installing backend dependencies & building..."
cd "$APP_DIR/backend"
npm config set ignore-scripts false
npm install
npm run build

success "Backend built successfully"

# ── Build frontend (unless --skip-build) ─────────────────────────────────────
if [ "$1" != "--skip-build" ]; then
    log "Installing & building frontend..."
    cd "$APP_DIR/frontend"
    npm install
    npm run build
    success "Frontend built → frontend/dist/"

    # Optional: Clear NGINX cache so new frontend assets are served immediately
    if [ -d "$NGINX_CACHE_DIR" ]; then
        log "Clearing NGINX static cache..."
        # Using sudo here in case the script is run as a normal user
        sudo rm -rf ${NGINX_CACHE_DIR}/*
        success "NGINX cache cleared"
    fi
else
    warn "Skipping frontend build (--skip-build)"
fi

cd "$APP_DIR"

# ── Reload PM2 (zero-downtime) ────────────────────────────────────────────────
log "Reloading PM2..."
if pm2 list | grep -q "kymiraai-backend"; then
    pm2 restart kymiraai-backend
    success "PM2 restarted"
else
    cd "$APP_DIR/backend"
    pm2 start dist/index.js --name "kymiraai-backend"
    pm2 save
    cd "$APP_DIR"
    success "PM2 started"
fi

# ── Test & reload NGINX ───────────────────────────────────────────────────────
log "Testing NGINX config..."

# We add 'sudo' here. If you run this script as a non-root user (which is safer),
# standard users do not have permission to test or reload NGINX.
sudo nginx -t || error "NGINX config test failed!"
sudo systemctl reload nginx
success "NGINX reloaded"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🚀 Deploy Complete! 🚀        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
log "PM2 status:"
pm2 status kymiraai-backend
