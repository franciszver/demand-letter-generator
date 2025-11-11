# AWS Resource Cleanup Script
# This script removes all AWS resources created for the demand-letter-generator project

Write-Host "🧹 AWS Resource Cleanup Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Function to empty S3 bucket
function Empty-S3Bucket {
    param([string]$BucketName)
    
    Write-Host "  Emptying bucket: $BucketName" -ForegroundColor Yellow
    try {
        # Delete all object versions
        $versions = aws s3api list-object-versions --bucket $BucketName --output json 2>$null | ConvertFrom-Json
        if ($versions.Versions) {
            foreach ($version in $versions.Versions) {
                aws s3api delete-object --bucket $BucketName --key $version.Key --version-id $version.VersionId 2>$null | Out-Null
            }
        }
        
        # Delete all delete markers
        if ($versions.DeleteMarkers) {
            foreach ($marker in $versions.DeleteMarkers) {
                aws s3api delete-object --bucket $BucketName --key $marker.Key --version-id $marker.VersionId 2>$null | Out-Null
            }
        }
        
        # Delete all objects
        aws s3 rm "s3://$BucketName" --recursive 2>$null | Out-Null
        
        Write-Host "    ✓ Bucket emptied" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "    ⚠ Error emptying bucket: $_" -ForegroundColor Yellow
        return $false
    }
}

# Function to delete S3 bucket
function Remove-S3Bucket {
    param([string]$BucketName)
    
    Write-Host "  Deleting bucket: $BucketName" -ForegroundColor Yellow
    try {
        # Empty bucket first
        Empty-S3Bucket -BucketName $BucketName
        
        # Delete bucket
        aws s3api delete-bucket --bucket $BucketName 2>$null | Out-Null
        Write-Host "    ✓ Bucket deleted" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "    ⚠ Error deleting bucket: $_" -ForegroundColor Yellow
        return $false
    }
}

# 1. Delete CloudFormation Stacks
Write-Host "1. Checking CloudFormation Stacks..." -ForegroundColor Cyan
$stacks = aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE CREATE_FAILED UPDATE_FAILED DELETE_FAILED --query "StackSummaries[?contains(StackName, 'demand-letter')].StackName" --output text 2>$null

if ($stacks) {
    foreach ($stack in $stacks -split "`t") {
        if ($stack) {
            Write-Host "  Deleting stack: $stack" -ForegroundColor Yellow
            aws cloudformation delete-stack --stack-name $stack 2>$null | Out-Null
            Write-Host "    ✓ Deletion initiated (this will take several minutes)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ No CloudFormation stacks found" -ForegroundColor Green
}

# 2. Delete S3 Buckets
Write-Host ""
Write-Host "2. Checking S3 Buckets..." -ForegroundColor Cyan
$buckets = aws s3 ls 2>$null | Select-String "demand-letter" | ForEach-Object { ($_ -split '\s+')[-1] }

if ($buckets) {
    foreach ($bucket in $buckets) {
        if ($bucket) {
            Remove-S3Bucket -BucketName $bucket
        }
    }
} else {
    Write-Host "  ✓ No S3 buckets found" -ForegroundColor Green
}

# 3. Delete Frontend S3 Buckets
Write-Host ""
Write-Host "3. Checking Frontend S3 Buckets..." -ForegroundColor Cyan
$frontendBuckets = aws s3 ls 2>$null | Select-String "frontend|demand-letter-generator-frontend" | ForEach-Object { ($_ -split '\s+')[-1] }

if ($frontendBuckets) {
    foreach ($bucket in $frontendBuckets) {
        if ($bucket) {
            Remove-S3Bucket -BucketName $bucket
        }
    }
} else {
    Write-Host "  ✓ No frontend S3 buckets found" -ForegroundColor Green
}

# 4. Delete Lambda Functions (if not managed by CloudFormation)
Write-Host ""
Write-Host "4. Checking Lambda Functions..." -ForegroundColor Cyan
$functions = aws lambda list-functions --query "Functions[?contains(FunctionName, 'demand-letter') || contains(FunctionName, 'ApiHandler') || contains(FunctionName, 'UploadHandler') || contains(FunctionName, 'GenerateHandler') || contains(FunctionName, 'RefineHandler') || contains(FunctionName, 'TemplatesHandler') || contains(FunctionName, 'ExportHandler')].FunctionName" --output text 2>$null

if ($functions) {
    foreach ($func in $functions -split "`t") {
        if ($func) {
            Write-Host "  Deleting function: $func" -ForegroundColor Yellow
            aws lambda delete-function --function-name $func 2>$null | Out-Null
            Write-Host "    ✓ Function deleted" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ No Lambda functions found" -ForegroundColor Green
}

# 5. Delete API Gateways (if not managed by CloudFormation)
Write-Host ""
Write-Host "5. Checking API Gateways..." -ForegroundColor Cyan
$apis = aws apigateway get-rest-apis --query "items[?contains(name, 'demand-letter')].id" --output text 2>$null

if ($apis) {
    foreach ($apiId in $apis -split "`t") {
        if ($apiId) {
            Write-Host "  Deleting API Gateway: $apiId" -ForegroundColor Yellow
            aws apigateway delete-rest-api --rest-api-id $apiId 2>$null | Out-Null
            Write-Host "    ✓ API Gateway deleted" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ No API Gateways found" -ForegroundColor Green
}

# 6. Delete Secrets Manager Secrets
Write-Host ""
Write-Host "6. Checking Secrets Manager Secrets..." -ForegroundColor Cyan
$secrets = aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'demand-letter') || contains(Name, 'openrouter')].Name" --output text 2>$null

if ($secrets) {
    foreach ($secret in $secrets -split "`t") {
        if ($secret -and $secret -notmatch "innerworld|dungeoncrawler") {
            Write-Host "  Deleting secret: $secret" -ForegroundColor Yellow
            aws secretsmanager delete-secret --secret-id $secret --force-delete-without-recovery 2>$null | Out-Null
            Write-Host "    ✓ Secret deleted" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ No Secrets Manager secrets found" -ForegroundColor Green
}

# 7. Delete IAM Roles (if not managed by CloudFormation)
Write-Host ""
Write-Host "7. Checking IAM Roles..." -ForegroundColor Cyan
$roles = aws iam list-roles --query "Roles[?contains(RoleName, 'demand-letter') || contains(RoleName, 'LambdaExecution')].RoleName" --output text 2>$null

if ($roles) {
    foreach ($role in $roles -split "`t") {
        if ($role) {
            Write-Host "  Deleting role: $role" -ForegroundColor Yellow
            # Detach policies first
            $policies = aws iam list-attached-role-policies --role-name $role --query "AttachedPolicies[].PolicyArn" --output text 2>$null
            if ($policies) {
                foreach ($policy in $policies -split "`t") {
                    if ($policy) {
                        aws iam detach-role-policy --role-name $role --policy-arn $policy 2>$null | Out-Null
                    }
                }
            }
            # Delete inline policies
            $inlinePolicies = aws iam list-role-policies --role-name $role --query "PolicyNames[]" --output text 2>$null
            if ($inlinePolicies) {
                foreach ($policy in $inlinePolicies -split "`t") {
                    if ($policy) {
                        aws iam delete-role-policy --role-name $role --policy-name $policy 2>$null | Out-Null
                    }
                }
            }
            # Delete role
            aws iam delete-role --role-name $role 2>$null | Out-Null
            Write-Host "    ✓ Role deleted" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ No IAM roles found" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Cleanup process initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. CloudFormation stacks may take 5-15 minutes to delete" -ForegroundColor White
Write-Host "  2. S3 buckets should be deleted immediately" -ForegroundColor White
Write-Host "  3. Verify cleanup completion using verification commands" -ForegroundColor White
Write-Host "  4. Check AWS Console to confirm all resources are removed" -ForegroundColor White
Write-Host ""

