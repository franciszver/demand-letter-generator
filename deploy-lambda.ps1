# Deploy Demand Letter Generator to AWS Lambda (PowerShell)
# Usage: .\deploy-lambda.ps1

Write-Host "Deploying Demand Letter Generator to AWS Lambda" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    aws --version | Out-Null
} catch {
    Write-Host "AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

try {
    sam --version | Out-Null
} catch {
    Write-Host "SAM CLI not found. Please install AWS SAM CLI first." -ForegroundColor Red
    exit 1
}

try {
    node --version | Out-Null
} catch {
    Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites check passed" -ForegroundColor Green

# Check if samconfig.toml exists
if (-not (Test-Path "infrastructure/samconfig.toml")) {
    Write-Host "samconfig.toml not found. Running setup script..." -ForegroundColor Yellow
    if (Test-Path "setup-lambda-env.ps1") {
        .\setup-lambda-env.ps1
    } else {
        Write-Host "setup-lambda-env.ps1 not found. Please run it first." -ForegroundColor Red
        exit 1
    }
}

# Build backend
Write-Host ""
Write-Host "Building backend..." -ForegroundColor Cyan
Set-Location backend
npm install
npm run build
Set-Location ..

# Check if database migrations need to be run
$runMigrations = Read-Host "Do you want to run database migrations? (y/N)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    Set-Location backend
    
    # Get database connection from samconfig.toml or prompt
    $dbHost = Read-Host "Enter database host (RDS endpoint)"
    $dbName = Read-Host "Enter database name [demand_letter_generator]"
    if ([string]::IsNullOrEmpty($dbName)) { $dbName = "demand_letter_generator" }
    $dbUser = Read-Host "Enter database user"
    $dbPassword = Read-Host "Enter database password" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    
    $env:DB_HOST = $dbHost
    $env:DB_NAME = $dbName
    $env:DB_USER = $dbUser
    $env:DB_PASSWORD = $dbPasswordPlain
    $env:DB_PORT = "5432"
    
    npm run migrate
    Write-Host "Migrations completed" -ForegroundColor Green
    Set-Location ..
}

# Build and deploy with SAM
Write-Host ""
Write-Host "Building SAM application..." -ForegroundColor Cyan
Set-Location infrastructure
sam build -t template-simple.yaml

Write-Host ""
Write-Host "Deploying to AWS Lambda..." -ForegroundColor Cyan
sam deploy -t template-simple.yaml --no-confirm-changeset

# Get API Gateway URL from stack outputs
Write-Host ""
Write-Host "Getting deployment information..." -ForegroundColor Cyan

$samConfigContent = Get-Content samconfig.toml -Raw
if ($samConfigContent -match 'stack_name\s*=\s*"([^"]+)"') {
    $stackName = $matches[1]
} else {
    Write-Host "Could not determine stack name from samconfig.toml" -ForegroundColor Red
    exit 1
}

$apiUrl = aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text

if ([string]::IsNullOrEmpty($apiUrl)) {
    Write-Host "Could not retrieve API Gateway URL. Check CloudFormation stack outputs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update frontend .env.production with: VITE_API_URL=$apiUrl" -ForegroundColor White
Write-Host "2. Build and deploy frontend: .\deploy-frontend-s3.ps1" -ForegroundColor White
Write-Host ""

# Update frontend .env.production if it exists
if (Test-Path "frontend/.env.production") {
    $updateEnv = Read-Host "Update frontend/.env.production with API URL? (Y/n)"
    if ($updateEnv -ne "n" -and $updateEnv -ne "N") {
        # Backup existing file
        Copy-Item frontend/.env.production frontend/.env.production.backup -ErrorAction SilentlyContinue
        
        # Update or add VITE_API_URL
        $envContent = Get-Content frontend/.env.production -Raw
        if ($envContent -match "VITE_API_URL") {
            $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=$apiUrl"
        } else {
            $envContent += "`nVITE_API_URL=$apiUrl"
        }
        Set-Content frontend/.env.production -Value $envContent
        
        Write-Host "Updated frontend/.env.production" -ForegroundColor Green
    }
}

Set-Location ..

