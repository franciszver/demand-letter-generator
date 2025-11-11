#!/bin/bash

# Docker deployment script for Demand Letter Generator
# Usage: ./deploy-docker.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "Deploying Demand Letter Generator in $ENVIRONMENT mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

if [ "$ENVIRONMENT" = "prod" ]; then
    # Production deployment
    echo "Production deployment requires environment variables to be set."
    echo "Please ensure the following are set:"
    echo "  - DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - OPENROUTER_API_KEY"
    echo "  - AWS credentials"
    echo ""
    read -p "Continue with production deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi

    # Build and start production containers
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d

    # Run migrations
    echo "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec backend npm run migrate

    echo "Production deployment complete!"
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost"
else
    # Development deployment
    echo "Starting development environment..."
    
    # Build and start containers
    docker-compose build
    docker-compose up -d

    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 5

    # Run migrations
    echo "Running database migrations..."
    docker-compose exec backend npm run migrate || echo "Migrations may have already been run."

    echo "Development deployment complete!"
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost:5173 (if running locally) or http://localhost (Docker)"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
fi

