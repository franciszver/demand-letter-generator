#!/bin/bash
# Quick Cloud Deployment Script for EC2/VPS
# Run this on your Ubuntu server after cloning the repo

set -e

echo "🚀 Demand Letter Generator - Quick Cloud Deployment"
echo "=================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please don't run as root. Use a regular user with sudo access."
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file template..."
    cat > .env << 'EOF'
# Database
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_USER=postgres
DB_NAME=demand_letter_generator

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_THIS_JWT_SECRET

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=gpt-4o

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_DOCUMENTS=demand-letter-generator-prod-documents
S3_BUCKET_PROCESSED=demand-letter-generator-prod-processed
S3_BUCKET_EXPORTS=demand-letter-generator-prod-exports

# CORS
CORS_ORIGIN=*

# Frontend API URL (update with your server IP or domain)
VITE_API_URL=http://YOUR_SERVER_IP:3001
EOF
    echo "⚠️  Please edit .env file with your actual values before continuing!"
    echo "   Run: nano .env"
    exit 1
fi

# Check if .env has been configured
if grep -q "CHANGE_THIS" .env; then
    echo "⚠️  .env file contains placeholder values. Please update it first."
    echo "   Run: nano .env"
    exit 1
fi

echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate || echo "⚠️  Migrations may have already been run"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "Frontend: http://$SERVER_IP"
echo "Backend API: http://$SERVER_IP:3001"
echo ""
echo "📋 Next Steps:"
echo "1. Create an admin user in the database"
echo "2. Test the application"
echo "3. Set up domain and SSL (optional)"
echo ""
echo "📊 Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.prod.yml down"

