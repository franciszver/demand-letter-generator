# Quick Cloud Deployment Script for Windows (to run on remote server via SSH)
# Or adapt for Windows Server with Docker Desktop

Write-Host "🚀 Demand Letter Generator - Quick Cloud Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file template..." -ForegroundColor Yellow
    @"
# Database
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_USER=postgres
DB_NAME=demand_letter_generator

# JWT Secret
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

# Frontend API URL
VITE_API_URL=http://YOUR_SERVER_IP:3001
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "⚠️  Please edit .env file with your actual values!" -ForegroundColor Yellow
    Write-Host "   Run: notepad .env" -ForegroundColor Yellow
    exit 1
}

# Check if .env has been configured
$envContent = Get-Content .env -Raw
if ($envContent -match "CHANGE_THIS") {
    Write-Host "⚠️  .env file contains placeholder values. Please update it first." -ForegroundColor Yellow
    Write-Host "   Run: notepad .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create an admin user in the database" -ForegroundColor White
Write-Host "2. Test the application" -ForegroundColor White
Write-Host "3. Set up domain and SSL (optional)" -ForegroundColor White
Write-Host ""
Write-Host "📊 Check logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
Write-Host "🛑 Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Cyan

