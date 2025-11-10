#!/bin/bash

# Deployment script for Demand Letter Generator
# This script helps deploy the application to AWS

set -e  # Exit on error

echo "🚀 Demand Letter Generator Deployment"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Please install it first."
    echo "   Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env file not found"
    echo "   Please create it with your configuration"
    echo "   See DEPLOY.md for required variables"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build backend
echo "🔨 Building backend..."
cd backend
npm install
npm run build
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy infrastructure
echo "☁️  Deploying infrastructure..."
cd infrastructure
sam build
echo ""
echo "📝 Starting guided deployment..."
echo "   You'll be prompted for configuration values"
sam deploy --guided

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run database migrations: cd backend && npm run migrate"
echo "   2. Get your API URL from CloudFormation outputs"
echo "   3. Update frontend .env with API URL and redeploy frontend"
echo "   4. See DEPLOY.md for frontend deployment options"

