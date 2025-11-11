# Quick Deployment Guide - AWS Lambda (PowerShell)

**Note:** All deployment scripts are PowerShell-based for Windows compatibility.

## Prerequisites

- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed
- Node.js 18+ installed
- Existing RDS PostgreSQL database
- OpenRouter API key
- PowerShell (Windows)

## Quick Start (3 Steps)

### 1. Setup Configuration

```powershell
.\setup-lambda-env.ps1
```

Enter:
- AWS region (default: us-east-1)
- Stack name (default: demand-letter-generator-prod)
- RDS endpoint
- Database credentials
- OpenRouter API key
- JWT secret (or auto-generate)

### 2. Deploy Backend

```powershell
.\deploy-lambda.ps1
```

This will:
- Build backend
- Optionally run migrations
- Deploy to Lambda
- Output API Gateway URL

### 3. Deploy Frontend

```powershell
.\deploy-frontend-s3.ps1
```

This will:
- Build frontend
- Create/configure S3 bucket
- Upload files
- Output website URL

## Manual Steps (if needed)

### Run Migrations

```powershell
cd backend
$env:DB_HOST = "your-rds-endpoint"
$env:DB_NAME = "demand_letter_generator"
$env:DB_USER = "your-user"
$env:DB_PASSWORD = "your-password"
$env:DB_PORT = "5432"
npm run migrate
```

### Get API Gateway URL

After deployment, get the URL from:
```powershell
aws cloudformation describe-stacks `
  --stack-name demand-letter-generator-prod `
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
  --output text
```

### Update Frontend Environment

Edit `frontend/.env.production`:
```
VITE_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

## Testing

1. Access frontend at S3 website URL
2. Register/login
3. Upload document
4. Generate letter
5. Test conflict resolution (open in two browsers)
6. Test polling (check active users display)

## Troubleshooting

**Migration fails:**
- Check database connection
- Verify RDS security group allows connections
- Check credentials

**Lambda deployment fails:**
- Verify AWS credentials: `aws sts get-caller-identity`
- Check SAM CLI: `sam --version`
- Review CloudFormation stack events

**Frontend can't connect:**
- Verify `VITE_API_URL` in `.env.production`
- Check CORS settings in SAM template
- Verify API Gateway is deployed

**No active users showing:**
- Check polling service is running (5-second interval)
- Verify `/api/drafts/:id/activity` endpoint works
- Check browser console for errors

