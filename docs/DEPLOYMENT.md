# Deployment Guide

Complete guide for deploying the Demand Letter Generator to AWS.

## Quick Start

For a quick 5-step deployment, see the [Quick Deployment Guide](#quick-deployment-guide) section below.

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- AWS SAM CLI installed (`sam --version`)
- Node.js 18+ installed
- Docker installed (for local PostgreSQL)
- OpenRouter API key
- AWS account with appropriate permissions

## Local Development Setup

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Quick Deployment Guide

Get your application hosted on AWS in minutes! See the [Quick Deployment section](#quick-deployment-5-steps) below for step-by-step instructions.

## AWS Deployment

### 1. Configure AWS

Ensure AWS CLI is configured:

```bash
aws configure
```

Enter your AWS Access Key ID and Secret Access Key (see [AWS Credentials Setup](AWS_CREDENTIALS_SETUP.md) for how to get these).

### 2. Set Up Database

**Option A: Create RDS PostgreSQL (Production)**

1. Go to RDS → Create database
2. Choose PostgreSQL
3. Use Free tier (db.t3.micro) for testing
4. Note the endpoint, username, and password

**Option B: Use Existing Database**

Use your existing PostgreSQL connection details.

### 3. Prepare Environment Variables

Create `backend/.env` with:

```env
# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=demand_letter_generator
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenRouter API Key
OPENROUTER_API_KEY=your-openrouter-api-key

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Buckets (will be created automatically)
S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports

# CORS
CORS_ORIGIN=*
```

**Generate JWT Secret:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. Deploy Infrastructure

You have two deployment options:

**Option A: Simple Deployment (Recommended - Single Lambda Function)**

```bash
cd infrastructure
sam build -t template-simple.yaml
sam deploy --guided -t template-simple.yaml
```

**Option B: Individual Lambda Functions**

```bash
cd infrastructure
sam build
sam deploy --guided
```

When prompted, enter:
- Stack name: `demand-letter-generator-dev` (or your choice)
- AWS Region: `us-east-1` (or your preferred region)
- Environment: `dev`
- OpenRouterApiKey: Your OpenRouter API key
- DatabaseHost: Your RDS endpoint
- DatabasePort: `5432`
- DatabaseName: `demand_letter_generator`
- DatabaseUser: Your database username
- DatabasePassword: Your database password
- JwtSecret: Your JWT secret
- CorsOrigin: `*` (or your frontend domain)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`

### 5. Run Database Migrations

After infrastructure is deployed:

```bash
cd backend
npm install
npm run migrate
```

### 6. Deploy Frontend

#### Option A: S3 + CloudFront

```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --profile default

# Create CloudFront distribution (via AWS Console or CLI)
```

#### Option B: Static Hosting Service

Upload the `dist/` folder to your preferred static hosting service.

### 7. Verify Deployment

1. **Check API Gateway:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name demand-letter-generator-dev \
     --query "Stacks[0].Outputs"
   ```

2. **Test API:**
   ```bash
   curl https://your-api-url.execute-api.us-east-1.amazonaws.com/dev/health
   ```

3. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/demand-letter-generator-dev-ApiHandler --follow
   ```

## Database Setup

### Local Development

PostgreSQL runs in Docker. Migrations run automatically:

```bash
cd backend
npm run migrate
```

### Production

1. Create RDS PostgreSQL instance
2. Update `DB_HOST` in environment variables
3. Run migrations:

```bash
npm run migrate
```

## Monitoring

### CloudWatch

- Lambda function logs
- API Gateway logs
- Error tracking

### Application Monitoring

- Health check endpoint: `GET /health`
- Audit logs in CloudWatch
- Error tracking via middleware

## Security Checklist

- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] S3 buckets have proper access policies
- [ ] API Gateway has rate limiting enabled
- [ ] CORS is configured correctly
- [ ] Environment variables are in Secrets Manager
- [ ] HTTPS is enabled for frontend
- [ ] Database connections use SSL in production

## Troubleshooting

### "Credentials not configured"
- Run `aws configure` and enter your credentials
- See [AWS Credentials Setup](AWS_CREDENTIALS_SETUP.md) for detailed instructions

### "Database connection failed"
- Check RDS security groups allow Lambda access
- Verify database credentials
- Ensure RDS is in the same region
- Check VPC configuration if using VPC

### "SAM build failed"
- Ensure Node.js 18+ is installed
- Check `backend/package.json` exists
- Verify TypeScript compiles: `cd backend && npm run build`

### "Deployment timeout"
- Increase Lambda timeout in `template-simple.yaml`
- Check CloudWatch logs for errors
- Verify S3 bucket creation permissions

### Lambda Deployment Issues
- Check IAM roles and permissions
- Verify environment variables
- Check CloudWatch logs

### CORS Errors
- Verify `CORS_ORIGIN` matches your frontend domain
- Check API Gateway CORS configuration

### S3 Access Denied
- Verify IAM roles have S3 permissions
- Check bucket policies
- See [Local S3 Setup](LOCAL_S3_SETUP.md) for troubleshooting

## Rollback

To rollback a deployment:

```bash
sam deploy --stack-name <stack-name> --no-execute-changeset
```

Review changes, then deploy previous version.

## Cost Optimization

- Use S3 lifecycle policies for old files
- Configure Lambda reserved concurrency
- Use CloudFront caching
- Monitor and optimize database queries

## Cost Estimate

**Free Tier (first 12 months):**
- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free
- RDS: db.t3.micro free for 750 hours/month
- S3: 5GB storage free

**After free tier:** ~$10-50/month for small usage

## Additional Resources

- [AWS Credentials Setup](AWS_CREDENTIALS_SETUP.md) - How to get AWS access keys
- [Local S3 Setup](LOCAL_S3_SETUP.md) - S3 configuration for local development

