#!/bin/bash

# ================================
# HBRC Direct Deployment Script
# ================================
# Deploy directly from local to VPS without GitHub
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
ENV_FILE=".env.production"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_header "Checking Prerequisites"

if ! command_exists docker; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed"

if ! command_exists docker-compose || ! command_exists docker; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_success "Docker Compose is installed"

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

# Build images locally
print_header "Building Docker Images Locally"

print_info "Building API image..."
docker build -t hbrc_mono-api:latest --target api -f Dockerfile . || {
    print_error "Failed to build API image"
    exit 1
}
print_success "API image built successfully"

print_info "Building Web image..."
docker build -t hbrc_mono-web:latest --target web -f Dockerfile . || {
    print_error "Failed to build Web image"
    exit 1
}
print_success "Web image built successfully"

# Save images to tar files
print_header "Saving Images to Tar Files"

print_info "Saving API image..."
docker save hbrc_mono-api:latest -o /tmp/hbrc-api.tar || {
    print_error "Failed to save API image"
    exit 1
}
print_success "API image saved to /tmp/hbrc-api.tar"

print_info "Saving Web image..."
docker save hbrc_mono-web:latest -o /tmp/hbrc-web.tar || {
    print_error "Failed to save Web image"
    exit 1
}
print_success "Web image saved to /tmp/hbrc-web.tar"

# Copy files to server
print_header "Copying Files to Server"

print_info "Copying docker-compose.yml..."
scp -i "$SSH_KEY" docker-compose.yml "$SERVER_USER@$SERVER_IP:$SERVER_PATH/" || {
    print_error "Failed to copy docker-compose.yml"
    exit 1
}
print_success "docker-compose.yml copied"

print_info "Copying nginx.conf..."
scp -i "$SSH_KEY" apps/web/nginx.conf "$SERVER_USER@$SERVER_IP:$SERVER_PATH/apps/web/" || {
    print_error "Failed to copy nginx.conf"
    exit 1
}
print_success "nginx.conf copied"

print_info "Copying Prisma files..."
scp -i "$SSH_KEY" -r apps/api/prisma "$SERVER_USER@$SERVER_IP:$SERVER_PATH/apps/api/" || {
    print_error "Failed to copy Prisma files"
    exit 1
}
print_success "Prisma files copied"

print_info "Copying API image tar (this may take a while)..."
scp -i "$SSH_KEY" /tmp/hbrc-api.tar "$SERVER_USER@$SERVER_IP:/tmp/" || {
    print_error "Failed to copy API image"
    exit 1
}
print_success "API image copied"

print_info "Copying Web image tar..."
scp -i "$SSH_KEY" /tmp/hbrc-web.tar "$SERVER_USER@$SERVER_IP:/tmp/" || {
    print_error "Failed to copy Web image"
    exit 1
}
print_success "Web image copied"

# Load images on server and restart containers
print_header "Deploying on Server"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e

echo "🔄 Loading API image..."
docker load -i /tmp/hbrc-api.tar

echo "🔄 Loading Web image..."
docker load -i /tmp/hbrc-web.tar

echo "🗑️  Cleaning up tar files..."
rm -f /tmp/hbrc-api.tar /tmp/hbrc-web.tar

echo "🔄 Stopping old containers..."
cd /home/islam/HBRC_MONO
docker compose --env-file .env.production down

echo "🚀 Starting new containers..."
docker compose --env-file .env.production up -d

echo "⏳ Waiting for containers to be healthy..."
sleep 10

echo "📊 Container status:"
docker ps

echo "✅ Deployment completed!"
ENDSSH

print_success "Images loaded and containers restarted on server"

# Clean up local tar files
print_header "Cleaning Up"

print_info "Removing local tar files..."
rm -f /tmp/hbrc-api.tar /tmp/hbrc-web.tar
print_success "Local tar files removed"

# Final status check
print_header "Deployment Status"

print_info "Checking API health..."
if curl -s --max-time 5 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    print_success "API is running on http://$SERVER_IP:3000"
else
    print_warning "API might still be starting up..."
fi

print_info "Checking Frontend health..."
if curl -s --max-time 5 "http://$SERVER_IP:5173" >/dev/null 2>&1; then
    print_success "Frontend is running on http://$SERVER_IP:5173"
else
    print_warning "Frontend might still be starting up..."
fi

print_header "Deployment Complete! 🎉"

echo ""
echo -e "${GREEN}Your application has been deployed successfully!${NC}"
echo ""
echo "📍 Endpoints:"
echo "   - API:      http://$SERVER_IP:3000"
echo "   - Docs:     http://$SERVER_IP:3000/api/docs"
echo "   - Frontend: http://$SERVER_IP:5173"
echo ""
echo "🔐 Admin Credentials:"
echo "   - Email:    admin@hbrc.com"
echo "   - Password: admin123"
echo ""
