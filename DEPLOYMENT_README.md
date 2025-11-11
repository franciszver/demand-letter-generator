# Deployment Guide - PowerShell Scripts Only

All deployment scripts are PowerShell-based for Windows compatibility.

## Quick Deployment (3 Steps)

### Step 1: Setup Configuration

```powershell
.\setup-lambda-env.ps1
```

This interactive script will:
- Collect AWS region and stack name
- Get database connection details (RDS endpoint)
- Collect OpenRouter API key
- Generate or accept JWT secret
- Create `infrastructure/samconfig.toml`

### Step 2: Deploy Backend to Lambda

```powershell
.\deploy-lambda.ps1
```

This script will:
- Check prerequisites (AWS CLI, SAM CLI, Node.js)
- Build backend TypeScript
- Optionally run database migrations
- Build and deploy SAM application
- Output API Gateway URL
- Update `frontend/.env.production` with API URL

### Step 3: Deploy Frontend to S3

```powershell
.\deploy-frontend-s3.ps1
```

Or specify a bucket name:
```powershell
.\deploy-frontend-s3.ps1 my-bucket-name
```

This script will:
- Build frontend with API Gateway URL
- Create S3 bucket (if not specified)
- Configure static website hosting
- Set bucket policy for public access
- Upload files
- Output website URL

## Prerequisites

Before running scripts, ensure you have:

1. **AWS CLI** installed and configured
   ```powershell
   aws --version
   aws configure
   ```

2. **AWS SAM CLI** installed
   ```powershell
   sam --version
   ```

3. **Node.js 18+** installed
   ```powershell
   node --version
   ```

4. **Existing RDS PostgreSQL** database
   - Note the endpoint, database name, user, and password

5. **OpenRouter API Key**
   - Get from https://openrouter.ai

## Script Details

### setup-lambda-env.ps1

Interactive configuration script that creates `infrastructure/samconfig.toml`.

**What it asks:**
- AWS region (default: us-east-1)
- CloudFormation stack name (default: demand-letter-generator-prod)
- RDS endpoint
- Database port (default: 5432)
- Database name (default: demand_letter_generator)
- Database user
- Database password
- OpenRouter API key
- JWT secret (or auto-generate)
- CORS origin (default: *)

### deploy-lambda.ps1

Automated Lambda deployment script.

**What it does:**
1. Checks prerequisites
2. Runs setup script if `samconfig.toml` missing
3. Builds backend TypeScript
4. Optionally runs database migrations
5. Builds SAM application
6. Deploys to Lambda
7. Gets API Gateway URL from CloudFormation outputs
8. Updates `frontend/.env.production`

**Interactive prompts:**
- "Do you want to run database migrations? (y/N)"
- Database connection details (if running migrations)
- "Update frontend/.env.production with API URL? (Y/n)"

### deploy-frontend-s3.ps1

Frontend deployment to S3.

**What it does:**
1. Checks/creates `frontend/.env.production` with API URL
2. Builds frontend
3. Creates S3 bucket (if not provided)
4. Configures static website hosting
5. Sets bucket policy
6. Uploads files
7. Outputs website URL

**Interactive prompts:**
- API Gateway URL (if not in .env.production)
- S3 bucket name (or auto-create)

## Manual Steps (if needed)

### Run Database Migrations Manually

```powershell
cd backend
$env:DB_HOST = "your-rds-endpoint.region.rds.amazonaws.com"
$env:DB_NAME = "demand_letter_generator"
$env:DB_USER = "your-db-user"
$env:DB_PASSWORD = "your-db-password"
$env:DB_PORT = "5432"
npm run migrate
cd ..
```

### Get API Gateway URL Manually

```powershell
aws cloudformation describe-stacks `
  --stack-name demand-letter-generator-prod `
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
  --output text
```

### Update Frontend Environment Manually

Edit `frontend/.env.production`:
```
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

## Troubleshooting

### Script Execution Policy

If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### AWS Credentials

Verify AWS credentials:
```powershell
aws sts get-caller-identity
```

### SAM CLI

Verify SAM CLI is installed:
```powershell
sam --version
```

If not installed, download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

### Database Connection

If migrations fail:
- Check RDS security group allows connections from your IP
- Verify database credentials
- Test connection: `psql -h your-endpoint -U your-user -d your-db`

### Lambda Deployment Issues

- Check CloudFormation stack events in AWS Console
- Verify IAM permissions for SAM CLI
- Check SAM template syntax: `sam validate -t infrastructure/template-simple.yaml`

### Frontend Build Issues

- Ensure `VITE_API_URL` is set in `.env.production`
- Check Node.js version: `node --version` (should be 18+)
- Clear build cache: `Remove-Item frontend/dist -Recurse -Force`

## Post-Deployment

1. **Test API:**
   ```powershell
   $apiUrl = "https://your-api-id.execute-api.region.amazonaws.com/prod"
   curl "$apiUrl/health"
   ```

2. **Test Frontend:**
   - Open website URL in browser
   - Register/login
   - Test document upload
   - Test letter generation

3. **Create Admin User:**
   - Connect to database
   - Run: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

4. **Monitor:**
   - Check CloudWatch logs for Lambda
   - Monitor API Gateway metrics
   - Check S3 bucket access logs

## Next Steps

- Set up CloudFront distribution for better performance
- Configure custom domain
- Enable HTTPS (via CloudFront or API Gateway custom domain)
- Set up monitoring and alerts
- Configure backups for database

