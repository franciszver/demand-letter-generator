# Deployment script for Demand Letter Generator (PowerShell)
# This script helps deploy the application to AWS

$ErrorActionPreference = "Stop"

Write-Host "🚀 Demand Letter Generator Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command sam -ErrorAction Stop
} catch {
    Write-Host "❌ AWS SAM CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
    exit 1
}

try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Check for .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env file not found" -ForegroundColor Yellow
    Write-Host "   Please create it with your configuration" -ForegroundColor Yellow
    Write-Host "   See DEPLOY.md for required variables" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Build backend
Write-Host "🔨 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm install
npm run build
Set-Location ..

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

# Deploy infrastructure
Write-Host "☁️  Deploying infrastructure..." -ForegroundColor Yellow
Set-Location infrastructure
sam build
Write-Host ""
Write-Host "📝 Starting guided deployment..." -ForegroundColor Yellow
Write-Host "   You'll be prompted for configuration values" -ForegroundColor Yellow
sam deploy --guided

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run database migrations: cd backend && npm run migrate"
Write-Host "   2. Get your API URL from CloudFormation outputs"
Write-Host "   3. Update frontend .env with API URL and redeploy frontend"
Write-Host "   4. See DEPLOY.md for frontend deployment options"

