# AWS Deployment Checklist

## Prerequisites ✅

- [x] AWS CLI installed and configured
- [x] SAM CLI installed
- [ ] AWS credentials configured (`aws configure`)
- [ ] RDS PostgreSQL database created (or use existing)
- [ ] OpenRouter API key
- [ ] S3 buckets created (or will be created by SAM)

## Pre-Deployment Steps

### 1. Verify AWS Configuration
```powershell
# Check AWS credentials
aws sts get-caller-identity

# Check AWS region
aws configure get region
```

### 2. Create/Verify RDS Database

**Option A: Use Existing RDS**
- Note your RDS endpoint
- Ensure security group allows Lambda access
- Note database credentials

**Option B: Create New RDS**
```powershell
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier demand-letter-generator-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name demand_letter_generator \
  --backup-retention-period 7 \
  --storage-encrypted
```

**Important**: 
- Note the RDS endpoint (e.g., `demand-letter-generator-db.xxxxx.us-east-1.rds.amazonaws.com`)
- Ensure security group allows inbound from Lambda VPC
- Save database credentials securely

### 3. Get OpenRouter API Key
- Sign up at https://openrouter.ai
- Get your API key from dashboard
- Ensure you have credits/balance

### 4. Setup SAM Configuration

**Option A: Interactive Setup (Recommended)**
```powershell
.\setup-lambda-env.ps1
```

This will prompt for:
- AWS region (default: us-east-1)
- Stack name (default: demand-letter-generator-prod)
- RDS endpoint
- Database credentials
- OpenRouter API key
- JWT secret (or auto-generate)
- CORS origin

**Option B: Manual Configuration**
Edit `infrastructure/samconfig.toml` with your values.

## Deployment Steps

### Step 1: Build Backend
```powershell
cd backend
npm install
npm run build
cd ..
```

### Step 2: Run Database Migrations (First Time Only)
```powershell
cd backend

# Set database environment variables
$env:DB_HOST = "your-rds-endpoint.region.rds.amazonaws.com"
$env:DB_PORT = "5432"
$env:DB_NAME = "demand_letter_generator"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "your-password"
$env:NODE_ENV = "production"

# Run migrations
npm run migrate

cd ..
```

**Note**: Ensure your IP is allowed in RDS security group, or run from EC2 instance in same VPC.

### Step 3: Deploy Backend to Lambda
```powershell
.\deploy-lambda.ps1
```

This script will:
1. Build the backend
2. Optionally run migrations
3. Build SAM application
4. Deploy to AWS Lambda
5. Output API Gateway URL

**Expected Output:**
```
API Gateway URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Step 4: Deploy Frontend to S3
```powershell
.\deploy-frontend-s3.ps1
```

This script will:
1. Build frontend
2. Create/configure S3 bucket for static hosting
3. Upload files
4. Output website URL

**Note**: The script will prompt for API Gateway URL if not in `frontend/.env.production`.

### Step 5: Update Frontend Environment (if needed)
Edit `frontend/.env.production`:
```
VITE_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

Then rebuild and redeploy frontend:
```powershell
.\deploy-frontend-s3.ps1
```

## Post-Deployment Verification

### 1. Test API Health Check
```powershell
$apiUrl = "https://your-api-gateway-url.execute-api.region.amazonaws.com/prod"
curl "$apiUrl/health"
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Test API with Detailed Health
```powershell
curl "$apiUrl/health?detailed=true"
```

This will verify:
- Database connectivity
- S3 bucket access
- Environment variables

### 3. Test User Registration
```powershell
curl -X POST "$apiUrl/api/auth/register" `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### 4. Test Frontend
- Open the S3 website URL in browser
- Register/login
- Upload a document
- Generate a letter

## Troubleshooting

### Lambda Deployment Fails

**Error: "Stack already exists"**
```powershell
# Delete existing stack
aws cloudformation delete-stack --stack-name demand-letter-generator-prod

# Wait for deletion, then redeploy
```

**Error: "Insufficient permissions"**
- Ensure IAM user/role has:
  - CloudFormation full access
  - Lambda full access
  - API Gateway full access
  - S3 full access
  - IAM role creation permissions

**Error: "Database connection failed"**
- Check RDS security group allows Lambda VPC access
- Verify database credentials
- Check RDS endpoint is correct
- Ensure database is publicly accessible (or Lambda is in same VPC)

### Frontend Can't Connect to API

**CORS Errors**
- Check `CorsOrigin` parameter in `samconfig.toml`
- Verify API Gateway CORS settings
- Check browser console for specific CORS error

**404 Errors**
- Verify `VITE_API_URL` in `frontend/.env.production`
- Rebuild frontend after changing `.env.production`
- Check API Gateway URL is correct

### Database Migration Issues

**Connection Refused**
- Check RDS security group
- Verify endpoint and credentials
- Try connecting from EC2 in same VPC

**Migration Already Run**
- Check `knex_migrations` table
- If needed, manually mark migrations as complete

## Cost Optimization

### Current Setup Costs (Estimated)

**Lambda:**
- Free tier: 1M requests/month
- After: ~$0.20 per 1M requests
- Compute: ~$0.0000166667 per GB-second

**API Gateway:**
- Free tier: 1M requests/month
- After: $3.50 per 1M requests

**S3:**
- Storage: $0.023/GB/month
- Requests: Minimal cost

**RDS (if using):**
- db.t3.micro: ~$15/month
- db.t3.small: ~$30/month

**Total Estimated**: $20-50/month for small usage

### Optimization Tips

1. **Use RDS Proxy** for connection pooling (reduces Lambda cold starts)
2. **Enable Lambda Provisioned Concurrency** for consistent performance
3. **Use CloudFront** for frontend (faster, cheaper)
4. **Enable S3 lifecycle policies** (already configured)
5. **Use Reserved Instances** for RDS if long-term

## Security Checklist

- [ ] JWT secret is strong and unique
- [ ] Database password is strong
- [ ] RDS security group restricts access
- [ ] S3 buckets have proper IAM policies
- [ ] API Gateway has rate limiting (configured in code)
- [ ] CORS origin is restricted (not `*` in production)
- [ ] OpenRouter API key is stored securely
- [ ] Environment variables are not logged

## Next Steps After Deployment

1. **Set up CloudFront** for frontend (optional but recommended)
2. **Configure custom domain** (optional)
3. **Set up monitoring** (CloudWatch alarms)
4. **Create admin user** in database
5. **Test all features** end-to-end
6. **Set up backups** for database
7. **Configure alerts** for errors

## Quick Reference

### Get API Gateway URL
```powershell
aws cloudformation describe-stacks `
  --stack-name demand-letter-generator-prod `
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
  --output text
```

### Get S3 Bucket Names
```powershell
aws cloudformation describe-stacks `
  --stack-name demand-letter-generator-prod `
  --query 'Stacks[0].Outputs' `
  --output table
```

### View Lambda Logs
```powershell
aws logs tail /aws/lambda/demand-letter-generator-prod-ApiHandler --follow
```

### Update Stack
```powershell
cd infrastructure
sam build -t template-simple.yaml
sam deploy -t template-simple.yaml
```

### Delete Stack (Cleanup)
```powershell
aws cloudformation delete-stack --stack-name demand-letter-generator-prod
```


