#!/bin/bash
# ===========================================
# GCE Server Setup Script
# ===========================================
# Run this script on a fresh GCE instance (Ubuntu 22.04)
# Usage: curl -sSL <url> | bash

set -e

echo "======================================"
echo "Zundan Studio - Server Setup"
echo "======================================"

# Update system
echo "[1/5] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please log out and log back in, then run this script again."
    exit 0
fi

# Install Docker Compose
echo "[3/5] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install git
echo "[4/5] Installing git..."
sudo apt-get install -y git

# Create app directory
echo "[5/5] Setting up application directory..."
APP_DIR=~/zundan_studio
if [ ! -d "$APP_DIR" ]; then
    echo "Please clone the repository manually:"
    echo "  git clone <your-repo-url> $APP_DIR"
    echo ""
    echo "Then run:"
    echo "  cd $APP_DIR"
    echo "  cp .env.production.example .env.production"
    echo "  # Edit .env.production with your settings"
    echo "  docker-compose -f docker-compose.prod.yml up -d --build"
fi

echo ""
echo "======================================"
echo "Setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for docker group)"
echo "2. Clone your repository"
echo "3. Configure .env.production"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
