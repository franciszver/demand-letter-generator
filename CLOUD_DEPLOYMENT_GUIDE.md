# Cloud Deployment Guide

## Overview

This guide covers deploying the Demand Letter Generator to the cloud using Docker. You have several options depending on your needs.

## Deployment Options

### Option 1: Docker Compose on VPS/EC2 (Recommended - Simplest)

**Best for:** Small to medium deployments, cost-effective, full control

**Steps:**

1. **Launch an EC2 Instance (or any VPS):**
   - AWS EC2: Ubuntu 22.04 LTS, t3.medium or larger
   - Or use DigitalOcean, Linode, etc.
   - Ensure ports 80, 443, and 22 are open in security group

2. **SSH into your server:**
   ```bash
   ssh -i your-key.pem ubuntu@your-server-ip
   ```

3. **Install Docker and Docker Compose:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Log out and back in for group changes
   ```

4. **Clone/Upload your code:**
   ```bash
   # Option A: Clone from Git
   git clone <your-repo-url>
   cd demand-letter-generator

   # Option B: Upload via SCP
   # From your local machine:
   scp -r -i your-key.pem . ubuntu@your-server-ip:/home/ubuntu/demand-letter-generator/
   ```

5. **Set up environment variables:**
   ```bash
   # Create .env file
   cd /home/ubuntu/demand-letter-generator
   nano .env
   ```

   Add these variables:
   ```env
   # Database
   DB_PASSWORD=your-secure-password-here
   DB_USER=postgres
   DB_NAME=demand_letter_generator

   # JWT
   JWT_SECRET=generate-a-strong-random-secret-here

   # OpenRouter
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=gpt-4o

   # AWS (for S3)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   S3_BUCKET_DOCUMENTS=demand-letter-generator-prod-documents
   S3_BUCKET_PROCESSED=demand-letter-generator-prod-processed
   S3_BUCKET_EXPORTS=demand-letter-generator-prod-exports

   # CORS
   CORS_ORIGIN=https://yourdomain.com

   # Frontend API URL
   VITE_API_URL=https://api.yourdomain.com
   ```

6. **Create S3 Buckets (if not exists):**
   ```bash
   aws s3 mb s3://demand-letter-generator-prod-documents
   aws s3 mb s3://demand-letter-generator-prod-processed
   aws s3 mb s3://demand-letter-generator-prod-exports
   ```

7. **Deploy:**
   ```bash
   # Make script executable
   chmod +x deploy-docker.sh

   # Deploy
   ./deploy-docker.sh prod
   ```

8. **Set up Nginx reverse proxy (for domain/SSL):**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx

   # Create nginx config
   sudo nano /etc/nginx/sites-available/demand-letter-generator
   ```

   Add this configuration:
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

   # Backend API
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable and get SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/demand-letter-generator /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

### Option 2: AWS ECS/Fargate (Scalable)

**Best for:** Production, auto-scaling, managed infrastructure

**Steps:**

1. **Build and push Docker images to ECR:**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Create ECR repositories
   aws ecr create-repository --repository-name demand-letter-backend
   aws ecr create-repository --repository-name demand-letter-frontend

   # Build and tag
   cd backend
   docker build -t demand-letter-backend .
   docker tag demand-letter-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/demand-letter-backend:latest

   cd ../frontend
   docker build -t demand-letter-frontend .
   docker tag demand-letter-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/demand-letter-frontend:latest

   # Push
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/demand-letter-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/demand-letter-frontend:latest
   ```

2. **Create ECS Task Definitions:**
   - Use AWS Console or CLI
   - Configure environment variables
   - Set up RDS PostgreSQL (or use RDS Proxy)

3. **Create ECS Service:**
   - Set up Application Load Balancer
   - Configure health checks
   - Set desired task count

### Option 3: Keep AWS Lambda (Current Setup)

**Note:** Requires adjustments for WebSocket support

**Steps:**

1. **Update SAM template with new Lambda functions**
2. **Deploy:**
   ```bash
   cd infrastructure
   sam build
   sam deploy --guided
   ```

## Quick Cloud Deployment (EC2/VPS)

Here's the fastest path to get it running:

### Step-by-Step EC2 Deployment

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.medium (2 vCPU, 4GB RAM)
   - Storage: 20GB
   - Security Group: Allow ports 22, 80, 443, 3001

2. **Connect and Install:**
   ```bash
   # SSH in
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Install Git
   sudo apt update
   sudo apt install -y git
   ```

3. **Clone and Setup:**
   ```bash
   git clone <your-repo-url>
   cd demand-letter-generator

   # Create .env file
   cat > .env << EOF
   DB_PASSWORD=$(openssl rand -base64 32)
   JWT_SECRET=$(openssl rand -base64 32)
   OPENROUTER_API_KEY=your-key-here
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   S3_BUCKET_DOCUMENTS=demand-letter-generator-prod-documents
   S3_BUCKET_PROCESSED=demand-letter-generator-prod-processed
   S3_BUCKET_EXPORTS=demand-letter-generator-prod-exports
   CORS_ORIGIN=*
   VITE_API_URL=http://your-ec2-ip:3001
   EOF
   ```

4. **Deploy:**
   ```bash
   chmod +x deploy-docker.sh
   ./deploy-docker.sh prod
   ```

5. **Access:**
   - Frontend: http://your-ec2-ip
   - Backend: http://your-ec2-ip:3001

## Testing on Cloud

Once deployed, test these endpoints:

### 1. Health Check
```bash
curl http://your-server-ip:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test API Endpoints
```bash
# Register user
curl -X POST http://your-server-ip:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://your-server-ip:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Save token from response, then:
TOKEN="your-jwt-token-here"

# Test user profile
curl -X POST http://your-server-ip:3001/api/user-profiles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"formalityLevel":8,"urgencyTendency":6,"empathyPreference":7}'

# Test metrics
curl http://your-server-ip:3001/api/drafts/{draft-id}/metrics \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Frontend
- Open http://your-server-ip in browser
- Register/Login
- Upload a document
- Generate a letter
- Check metrics display
- Test refinement history

### 4. Test Admin Dashboard
```bash
# First, create admin user in database
# Connect to PostgreSQL:
docker exec -it demand-letter-generator-db-prod psql -U postgres -d demand_letter_generator

# In psql:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
\q

# Then access /admin in frontend
```

## Environment Variables Checklist

Make sure these are set in your `.env` or environment:

**Required:**
- [ ] `DB_PASSWORD` - Strong database password
- [ ] `JWT_SECRET` - Strong random secret (32+ chars)
- [ ] `OPENROUTER_API_KEY` - Your OpenRouter API key
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_REGION` - AWS region (e.g., us-east-1)

**S3 Buckets (create these first):**
- [ ] `S3_BUCKET_DOCUMENTS` - Documents bucket name
- [ ] `S3_BUCKET_PROCESSED` - Processed content bucket
- [ ] `S3_BUCKET_EXPORTS` - Exports bucket

**Optional but Recommended:**
- [ ] `CORS_ORIGIN` - Your frontend domain (or * for dev)
- [ ] `VITE_API_URL` - Backend API URL for frontend

## Security Checklist

Before going to production:

- [ ] Change default database password
- [ ] Use strong JWT secret (32+ random characters)
- [ ] Set `CORS_ORIGIN` to your actual domain (not *)
- [ ] Enable HTTPS/SSL (Let's Encrypt)
- [ ] Set up firewall rules (only allow 80, 443, 22)
- [ ] Use AWS IAM roles instead of access keys (if on AWS)
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review and restrict S3 bucket policies

## Monitoring

**Check Logs:**
```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Specific service
docker logs demand-letter-generator-backend-prod -f
```

**Check Status:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

**Restart Services:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

## Troubleshooting Cloud Deployment

**Can't connect to database:**
- Check security group allows connections
- Verify DB_PASSWORD is correct
- Check database container is running: `docker ps`

**API returns 500 errors:**
- Check backend logs: `docker logs demand-letter-generator-backend-prod`
- Verify environment variables are set
- Check OpenRouter API key is valid

**Frontend can't connect to backend:**
- Verify `VITE_API_URL` matches backend URL
- Check CORS settings
- Verify backend is accessible

**Metrics not calculating:**
- Check OpenRouter API key has credits
- Verify API key is set correctly
- Check backend logs for errors

## Quick Deploy Script for EC2

Save this as `quick-deploy.sh` on your server:

```bash
#!/bin/bash
set -e

echo "🚀 Quick Deploy Script for Demand Letter Generator"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Build and start
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📊 Running migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate

echo "✅ Deployment complete!"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Backend: http://$(curl -s ifconfig.me):3001"
```

## Next Steps After Deployment

1. **Set up domain** (optional but recommended)
2. **Configure SSL** with Let's Encrypt
3. **Set up monitoring** (CloudWatch, Datadog, etc.)
4. **Create admin user** in database
5. **Test all features** end-to-end
6. **Set up backups** for database
7. **Configure alerts** for errors

## Cost Estimates

**EC2 t3.medium (Docker Compose):**
- ~$30-50/month
- Good for small to medium usage

**ECS Fargate:**
- ~$50-100/month (depending on usage)
- Better for scaling

**RDS PostgreSQL:**
- ~$15-50/month (db.t3.micro to db.t3.small)
- Recommended for production

**S3 Storage:**
- ~$0.023/GB/month
- Very cheap for document storage

**Total estimated:** $50-150/month for small to medium deployment

