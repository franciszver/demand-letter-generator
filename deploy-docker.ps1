# Docker deployment script for Demand Letter Generator (PowerShell)
# Usage: .\deploy-docker.ps1 [dev|prod]

param(
    [string]$Environment = "dev"
)

Write-Host "Deploying Demand Letter Generator in $Environment mode..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Error: docker-compose is not installed. Please install docker-compose and try again." -ForegroundColor Red
    exit 1
}

if ($Environment -eq "prod") {
    # Production deployment
    Write-Host "Production deployment requires environment variables to be set." -ForegroundColor Yellow
    Write-Host "Please ensure the following are set:" -ForegroundColor Yellow
    Write-Host "  - DB_PASSWORD" -ForegroundColor Yellow
    Write-Host "  - JWT_SECRET" -ForegroundColor Yellow
    Write-Host "  - OPENROUTER_API_KEY" -ForegroundColor Yellow
    Write-Host "  - AWS credentials" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Continue with production deployment? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 1
    }

    # Build and start production containers
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d

    # Run migrations
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml exec backend npm run migrate

    Write-Host "Production deployment complete!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
    Write-Host "Frontend: http://localhost" -ForegroundColor Green
} else {
    # Development deployment
    Write-Host "Starting development environment..." -ForegroundColor Cyan
    
    # Build and start containers
    docker-compose build
    docker-compose up -d

    # Wait for database to be ready
    Write-Host "Waiting for database to be ready..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5

    # Run migrations
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    try {
        docker-compose exec backend npm run migrate
    } catch {
        Write-Host "Migrations may have already been run." -ForegroundColor Yellow
    }

    Write-Host "Development deployment complete!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:5173 (if running locally) or http://localhost (Docker)" -ForegroundColor Green
    Write-Host ""
    Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Cyan
    Write-Host "To stop: docker-compose down" -ForegroundColor Cyan
}

