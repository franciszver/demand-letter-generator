# Interactive setup script for Lambda deployment configuration (PowerShell)
# Usage: .\setup-lambda-env.ps1

Write-Host "Setting up Lambda deployment configuration" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Get AWS region
$awsRegion = Read-Host "Enter AWS region [us-east-1]"
if ([string]::IsNullOrEmpty($awsRegion)) { $awsRegion = "us-east-1" }

# Get stack name
$stackName = Read-Host "Enter CloudFormation stack name [demand-letter-generator-prod]"
if ([string]::IsNullOrEmpty($stackName)) { $stackName = "demand-letter-generator-prod" }

# Get database connection details
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Yellow
$dbHost = Read-Host "Enter RDS endpoint (database host)"
$dbPort = Read-Host "Enter database port [5432]"
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "5432" }
$dbName = Read-Host "Enter database name [demand_letter_generator]"
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "demand_letter_generator" }
$dbUser = Read-Host "Enter database user"
$dbPassword = Read-Host "Enter database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Get OpenRouter API key
Write-Host ""
Write-Host "OpenRouter Configuration:" -ForegroundColor Yellow
$openRouterKey = Read-Host "Enter OpenRouter API key"

# Get JWT secret
Write-Host ""
Write-Host "Security Configuration:" -ForegroundColor Yellow
$jwtSecret = Read-Host "Enter JWT secret (or press Enter to generate)"
if ([string]::IsNullOrEmpty($jwtSecret)) {
    $bytes = 1..32 | ForEach-Object { Get-Random -Maximum 256 }
    $jwtSecret = [Convert]::ToBase64String($bytes)
    Write-Host "Generated JWT secret: $jwtSecret" -ForegroundColor Green
}

# Get CORS origin
Write-Host ""
$corsOrigin = Read-Host "Enter CORS origin [*]"
if ([string]::IsNullOrEmpty($corsOrigin)) { $corsOrigin = "*" }

# Create samconfig.toml
Write-Host ""
Write-Host "Creating samconfig.toml..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path infrastructure | Out-Null

$samConfig = @"
version = 0.1

[default]
[default.global.parameters]
stack_name = "$stackName"
region = "$awsRegion"

[default.build.parameters]
cached = true
parallel = true

[default.validate.parameters]
lint = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
region = "$awsRegion"
parameter_overrides = "Environment=`"prod`" DatabaseHost=`"$dbHost`" DatabasePort=`"$dbPort`" DatabaseName=`"$dbName`" DatabaseUser=`"$dbUser`" DatabasePassword=`"$dbPasswordPlain`" OpenRouterApiKey=`"$openRouterKey`" JwtSecret=`"$jwtSecret`" CorsOrigin=`"$corsOrigin`""

[default.package.parameters]
resolve_s3 = true

[default.sync.parameters]
watch = true
"@

Set-Content -Path "infrastructure/samconfig.toml" -Value $samConfig

Write-Host "Created infrastructure/samconfig.toml" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration summary:" -ForegroundColor Yellow
Write-Host "  Stack name: $stackName" -ForegroundColor White
Write-Host "  Region: $awsRegion" -ForegroundColor White
Write-Host "  Database: $dbHost`:$dbPort/$dbName" -ForegroundColor White
Write-Host "  CORS origin: $corsOrigin" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete! You can now run .\deploy-lambda.ps1" -ForegroundColor Green

