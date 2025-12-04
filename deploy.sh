#!/bin/bash

# ================================
# HBRC Git-based Deployment Script
# ================================
# Pull from GitHub and build on server
# Usage: ./deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="$HOME/.ssh/id_rsa"
SERVER_USER="islam"
SERVER_IP="34.71.218.241"
SERVER_PATH="/home/islam/HBRC_MONO"
GIT_REPO="https://github.com/Islamawad132/HBRC_MONO.git"
GIT_BRANCH="main"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check prerequisites
print_header "Checking Prerequisites"

if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH key not found at $SSH_KEY"
    exit 1
fi
print_success "SSH key found"

# Test SSH connection
print_info "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" >/dev/null 2>&1; then
    print_error "Cannot connect to server via SSH"
    exit 1
fi
print_success "SSH connection successful"

# Deploy on server
print_header "Deploying on Server"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" bash << ENDSSH
set -e

echo "================================================"
echo "  📥 Pulling Latest Code from GitHub"
echo "================================================"

# Navigate to project directory
cd $SERVER_PATH

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "ℹ️  Cloning repository for the first time..."
    cd ..
    rm -rf HBRC_MONO
    git clone $GIT_REPO
    cd HBRC_MONO
else
    echo "✅ Git repository found"
fi

# Fetch and pull latest changes
echo "🔄 Fetching latest changes..."
git fetch origin

echo "🔄 Pulling latest code from $GIT_BRANCH..."
git reset --hard origin/$GIT_BRANCH
git pull origin $GIT_BRANCH

echo "✅ Code updated successfully"

echo ""
echo "================================================"
echo "  🐳 Building Docker Images"
echo "================================================"

# Build images using docker-compose
echo "🔨 Building API image..."
docker compose build api

echo "🔨 Building Web image..."
docker compose build web

echo "✅ Images built successfully"

echo ""
echo "================================================"
echo "  🚀 Restarting Containers"
echo "================================================"

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose --env-file .env.production down

# Start new containers
echo "🚀 Starting new containers..."
docker compose --env-file .env.production up -d

# Wait for containers to be healthy
echo "⏳ Waiting for containers to be healthy..."
sleep 15

echo ""
echo "================================================"
echo "  📊 Deployment Status"
echo "================================================"

# Show container status
echo "📦 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 Container logs (last 20 lines):"
echo ""
echo "--- API Logs ---"
docker logs --tail 20 hbrc-api

echo ""
echo "--- Web Logs ---"
docker logs --tail 20 hbrc-web

echo ""
echo "================================================"
echo "  🧹 Cleanup"
echo "================================================"

# Remove old images
echo "🗑️  Removing old/unused images..."
docker image prune -f

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "================================================"
echo ""
echo "📍 Your application is running at:"
echo "   - API:      http://$SERVER_IP:3000"
echo "   - Docs:     http://$SERVER_IP:3000/api/docs"
echo "   - Frontend: http://$SERVER_IP:5173"
echo ""
ENDSSH

# Final status check from local machine
print_header "Final Health Check"

print_info "Checking API health..."
sleep 5
if curl -s --max-time 10 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    print_success "API is responding!"
    RESPONSE=$(curl -s "http://$SERVER_IP:3000")
    echo "   Response: $RESPONSE"
else
    print_warning "API might still be starting up... Check logs with:"
    echo "   ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'docker logs -f hbrc-api'"
fi

print_info "Checking Frontend health..."
if curl -s --max-time 10 "http://$SERVER_IP:5173" >/dev/null 2>&1; then
    print_success "Frontend is responding!"
else
    print_warning "Frontend might still be starting up... Check logs with:"
    echo "   ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'docker logs -f hbrc-web'"
fi

print_header "Deployment Complete! 🎉"

echo ""
echo -e "${GREEN}✨ Your application has been deployed successfully!${NC}"
echo ""
echo "📖 To view logs:"
echo "   ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "   docker logs -f hbrc-api    # API logs"
echo "   docker logs -f hbrc-web    # Web logs"
echo ""
