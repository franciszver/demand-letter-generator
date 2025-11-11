# Sync .env file values to SAM configuration
# This helps map your local .env to AWS Lambda deployment

Write-Host "🔄 Syncing .env to SAM Configuration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envFiles = @(".env", "backend/.env")
$envFile = $null

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $envFile = $file
        Write-Host "Found .env file: $file" -ForegroundColor Green
        break
    }
}

if (-not $envFile) {
    Write-Host "❌ No .env file found in root or backend directory" -ForegroundColor Red
    Write-Host "Please create a .env file or run this script from the project root" -ForegroundColor Yellow
    exit 1
}

# Read .env file
Write-Host "Reading $envFile..." -ForegroundColor Cyan
$envContent = Get-Content $envFile -Raw

# Parse .env file (simple key=value parser)
$envVars = @{}
$lines = $envContent -split "`n"
foreach ($line in $lines) {
    $line = $line.Trim()
    # Skip comments and empty lines
    if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes if present
        $value = $value -replace '^["'']|["'']$', ''
        $envVars[$key] = $value
    }
}

Write-Host "Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

# Display found variables
Write-Host "📋 Environment Variables Found:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys | Sort-Object) {
    $value = $envVars[$key]
    # Mask sensitive values
    if ($key -match "PASSWORD|SECRET|KEY|TOKEN") {
        $displayValue = if ($value.Length -gt 8) { $value.Substring(0, 4) + "..." + $value.Substring($value.Length - 4) } else { "***" }
        Write-Host "  $key = $displayValue" -ForegroundColor Gray
    } else {
        Write-Host "  $key = $value" -ForegroundColor White
    }
}
Write-Host ""

# Map .env variables to SAM parameters
Write-Host "🔍 Mapping to SAM Configuration:" -ForegroundColor Cyan
Write-Host ""

# Required mappings
$mappings = @{
    "DB_HOST" = "DatabaseHost"
    "DB_PORT" = "DatabasePort"
    "DB_NAME" = "DatabaseName"
    "DB_USER" = "DatabaseUser"
    "DB_PASSWORD" = "DatabasePassword"
    "JWT_SECRET" = "JwtSecret"
    "OPENROUTER_API_KEY" = "OpenRouterApiKey"
    "CORS_ORIGIN" = "CorsOrigin"
}

$samParams = @{
    "Environment" = "prod"
}

# Map variables
foreach ($envKey in $mappings.Keys) {
    $samKey = $mappings[$envKey]
    if ($envVars.ContainsKey($envKey)) {
        $samParams[$samKey] = $envVars[$envKey]
        Write-Host "  ✓ $envKey → $samKey" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $envKey → $samKey (not found in .env)" -ForegroundColor Yellow
    }
}

# Check for missing required variables
Write-Host ""
Write-Host "📊 Configuration Status:" -ForegroundColor Cyan

$required = @("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET", "OPENROUTER_API_KEY")
$missing = @()

foreach ($req in $required) {
    if ($envVars.ContainsKey($req)) {
        Write-Host "  ✅ $req" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $req (MISSING)" -ForegroundColor Red
        $missing += $req
    }
}

# Optional variables
$optional = @("DB_PORT", "CORS_ORIGIN", "AWS_REGION", "S3_BUCKET_DOCUMENTS", "S3_BUCKET_PROCESSED", "S3_BUCKET_EXPORTS")
Write-Host ""
Write-Host "Optional variables:" -ForegroundColor Yellow
foreach ($opt in $optional) {
    if ($envVars.ContainsKey($opt)) {
        Write-Host "  ✓ $opt = $($envVars[$opt])" -ForegroundColor Gray
    }
}

# Generate SAM parameter string
Write-Host ""
Write-Host "🔧 Generating SAM parameter_overrides..." -ForegroundColor Cyan

# Set defaults for missing values
if (-not $samParams.ContainsKey("DatabasePort")) {
    $samParams["DatabasePort"] = "5432"
}
if (-not $samParams.ContainsKey("CorsOrigin")) {
    $samParams["CorsOrigin"] = "*"
}

# Build parameter string
$paramString = "Environment=`"$($samParams['Environment'])`""
foreach ($key in $samParams.Keys | Where-Object { $_ -ne "Environment" }) {
    $value = $samParams[$key]
    $paramString += " $key=`"$value`""
}

Write-Host ""
Write-Host "📝 SAM Configuration:" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Add this to infrastructure/samconfig.toml:" -ForegroundColor Cyan
Write-Host ""
Write-Host "[default.deploy.parameters]"
Write-Host "parameter_overrides = `"$paramString`""
Write-Host ""

# Ask if user wants to update samconfig.toml
if ($missing.Count -eq 0) {
    $update = Read-Host "Update infrastructure/samconfig.toml with these values? (Y/n)"
    if ($update -ne "n" -and $update -ne "N") {
        # Read current samconfig.toml
        $samConfigPath = "infrastructure/samconfig.toml"
        if (Test-Path $samConfigPath) {
            $samConfig = Get-Content $samConfigPath -Raw
            
            # Update parameter_overrides line
            if ($samConfig -match 'parameter_overrides\s*=\s*"[^"]*"') {
                $samConfig = $samConfig -replace 'parameter_overrides\s*=\s*"[^"]*"', "parameter_overrides = `"$paramString`""
                Set-Content -Path $samConfigPath -Value $samConfig
                Write-Host "✅ Updated $samConfigPath" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Could not find parameter_overrides in samconfig.toml" -ForegroundColor Yellow
                Write-Host "Please manually add the parameter_overrides line above" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  samconfig.toml not found. Run .\setup-lambda-env.ps1 first" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  Missing required variables. Please add them to your .env file:" -ForegroundColor Yellow
    foreach ($miss in $missing) {
        Write-Host "  - $miss" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Done! You can now run .\deploy-lambda.ps1" -ForegroundColor Green


