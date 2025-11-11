# Next Steps - Phase 3 Implementation

## ✅ Completed
- [x] Database migrations created and run
- [x] All Phase 3 backend code implemented
- [x] All Phase 3 frontend components created
- [x] Docker infrastructure set up
- [x] Migration tracking table fixed

## Immediate Next Steps

### 1. Test Locally (Recommended First)

**Start the database:**
```bash
docker-compose up -d postgres
```

**Backend Setup:**
```bash
cd backend
npm install
# Ensure .env file exists with:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=demand_letter_generator
# - DB_USER=postgres
# - DB_PASSWORD=postgres
# - JWT_SECRET=<your-secret>
# - OPENROUTER_API_KEY=<your-key>
# - AWS credentials (if using S3)
npm run build
npm run dev
```

**Frontend Setup (in a new terminal):**
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 2. Test Phase 3 Features

**Create an Admin User:**
- Register a new user via `/api/auth/register` with `role: 'admin'`
- Or manually update a user in the database: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

**Test Checklist:**
1. **User Profile:**
   - Navigate to `/profile`
   - Fill out user profile preferences
   - Save and verify

2. **Case Context:**
   - Upload a document
   - Click "Add Case Context" before generating
   - Fill out case context form
   - Generate letter

3. **Letter Generation with EQ:**
   - Generate a letter with case context
   - Verify metrics are calculated
   - Check that letter tone matches preferences

4. **Metrics Display:**
   - Open a draft letter
   - Verify 8 metrics meters display
   - Edit the letter and watch metrics update

5. **Refinement History:**
   - Refine a letter with instructions
   - Click "Show Refinement History"
   - Verify history shows before/after metrics

6. **Time Tracking:**
   - Generate and refine letters
   - Check admin dashboard for time saved stats

7. **Admin Dashboard:**
   - Login as admin
   - Navigate to `/admin`
   - Verify all metrics display correctly

8. **User Relationships:**
   - As an attorney, navigate to `/users`
   - Create a secondary user relationship
   - Verify relationship appears

### 3. Deploy with Docker (When Ready)

**Option A: Development Deployment**
```powershell
.\deploy-docker.ps1 dev
```

**Option B: Production Deployment**
```powershell
# First, set environment variables in docker-compose.prod.yml or .env file
.\deploy-docker.ps1 prod
```

**Required Environment Variables for Production:**
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Strong random secret
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `S3_BUCKET_DOCUMENTS` - S3 bucket name
- `S3_BUCKET_PROCESSED` - S3 bucket name
- `S3_BUCKET_EXPORTS` - S3 bucket name
- `CORS_ORIGIN` - Your frontend domain

### 4. Production Deployment Options

**Option 1: Docker Compose on VPS/EC2 (Simplest)**
- Spin up an EC2 instance or VPS
- Install Docker and Docker Compose
- Copy your code
- Run `.\deploy-docker.ps1 prod`
- Set up reverse proxy (nginx) for domain/SSL

**Option 2: AWS ECS/Fargate (Scalable)**
- Build Docker images
- Push to ECR (Elastic Container Registry)
- Create ECS task definitions
- Deploy to ECS/Fargate
- Set up Application Load Balancer

**Option 3: Keep AWS Lambda (Current Setup)**
- Update SAM template with new Lambda functions
- Deploy using `sam deploy`
- Note: WebSocket (Socket.io) may need adjustment for Lambda

### 5. Post-Deployment Tasks

1. **Create Admin User:**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
   ```

2. **Verify All Endpoints:**
   - Test all new API endpoints
   - Verify authentication works
   - Check admin routes are protected

3. **Monitor:**
   - Check application logs
   - Monitor database performance
   - Watch for errors in metrics calculation

4. **Set Up Monitoring:**
   - CloudWatch logs (if on AWS)
   - Error tracking (Sentry, etc.)
   - Performance monitoring

## Quick Test Commands

**Test Backend Health:**
```bash
curl http://localhost:3001/health
```

**Test API (with auth token):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/drafts
```

**Check Database:**
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d demand_letter_generator

# List tables
\dt

# Check migrations
SELECT * FROM knex_migrations ORDER BY id;
```

## Troubleshooting

**If migrations fail:**
- Run `node backend/fix-migrations.js` again
- Check database connection
- Verify all migration files exist

**If Docker build fails:**
- Check Docker is running
- Verify Dockerfile syntax
- Check for path length issues (Windows)

**If metrics don't calculate:**
- Verify OpenRouter API key is set
- Check API key has credits
- Fallback heuristics will work if API fails

**If admin dashboard shows no data:**
- Create some test users and letters
- Verify admin user role is set correctly
- Check database has data

## Recommended Order

1. ✅ **Test locally first** - Verify everything works
2. **Fix any issues** found during testing
3. **Deploy to staging** (if you have one)
4. **Test in staging** environment
5. **Deploy to production**
6. **Monitor and optimize**

## Questions to Consider

1. **Where do you want to host?**
   - Docker Compose on VPS/EC2 (easiest)
   - AWS ECS/Fargate (scalable)
   - Keep Lambda (requires WebSocket adjustment)

2. **Do you have a domain?**
   - Need to set up DNS
   - SSL certificate (Let's Encrypt)
   - Reverse proxy configuration

3. **Database:**
   - Use Docker PostgreSQL for production?
   - Or AWS RDS (managed, more reliable)?

4. **Monitoring:**
   - Set up error tracking?
   - Application performance monitoring?
   - Log aggregation?

## Current Status

✅ **Implementation:** 100% Complete
✅ **Migrations:** Applied successfully
⏳ **Testing:** Ready to begin
⏳ **Deployment:** Ready when you are

You're ready to test and deploy! Start with local testing to verify everything works, then proceed with deployment.

