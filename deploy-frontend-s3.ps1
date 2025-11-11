# Deploy frontend to S3 bucket (PowerShell)
# Usage: .\deploy-frontend-s3.ps1 [bucket-name]

Write-Host "🚀 Deploying Frontend to S3" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Check if API URL is set
if (-not (Test-Path "frontend/.env.production")) {
    Write-Host "⚠️  frontend/.env.production not found" -ForegroundColor Yellow
    $apiUrl = Read-Host "Enter API Gateway URL"
    "VITE_API_URL=$apiUrl" | Out-File -FilePath "frontend/.env.production" -Encoding utf8
} else {
    $envContent = Get-Content frontend/.env.production -Raw
    if ($envContent -match "VITE_API_URL=(.+)") {
        $apiUrl = $matches[1].Trim()
    } else {
        $apiUrl = Read-Host "Enter API Gateway URL"
        "VITE_API_URL=$apiUrl" | Add-Content -Path "frontend/.env.production"
    }
}

Write-Host "Using API URL: $apiUrl" -ForegroundColor Cyan

# Build frontend
Write-Host ""
Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
npm run build
Set-Location ..

# Get or create S3 bucket
$bucketName = $args[0]
if ([string]::IsNullOrEmpty($bucketName)) {
    $bucketName = Read-Host "Enter S3 bucket name (or press Enter to create one)"
    if ([string]::IsNullOrEmpty($bucketName)) {
        $bucketName = "demand-letter-generator-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Write-Host "Creating bucket: $bucketName" -ForegroundColor Cyan
        aws s3 mb "s3://$bucketName"
    }
}

# Configure bucket for static website hosting
Write-Host ""
Write-Host "📦 Configuring S3 bucket for static website hosting..." -ForegroundColor Cyan
aws s3 website "s3://$bucketName" `
    --index-document index.html `
    --error-document index.html

# Set bucket policy for public read access
Write-Host ""
Write-Host "🔓 Setting bucket policy..." -ForegroundColor Cyan
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$bucketName/*"
        }
    )
} | ConvertTo-Json -Depth 10

$tempPolicyFile = "$env:TEMP/bucket-policy-$(Get-Date -Format 'yyyyMMddHHmmss').json"
$bucketPolicy | Out-File -FilePath $tempPolicyFile -Encoding utf8
aws s3api put-bucket-policy --bucket $bucketName --policy "file://$tempPolicyFile"
Remove-Item $tempPolicyFile -ErrorAction SilentlyContinue

# Upload files
Write-Host ""
Write-Host "📤 Uploading files to S3..." -ForegroundColor Cyan
aws s3 sync frontend/dist/ "s3://$bucketName" --delete

# Get website URL
$region = aws configure get region
if ([string]::IsNullOrEmpty($region)) { $region = "us-east-1" }
$websiteUrl = "http://$bucketName.s3-website-$region.amazonaws.com"

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "Bucket name: $bucketName" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Note: For production, consider:" -ForegroundColor Yellow
Write-Host "  1. Setting up CloudFront distribution" -ForegroundColor White
Write-Host "  2. Using a custom domain" -ForegroundColor White
Write-Host "  3. Enabling HTTPS" -ForegroundColor White

