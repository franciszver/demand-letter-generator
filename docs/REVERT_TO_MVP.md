# Revert to MVP State - Emergency Recovery Guide

**Last Updated:** Current MVP State (Post-Rebrand, Pre-Enterprise Features)
**Git Commit:** `6b2f3dd` (themeing updated) / `398a3d4` (basic functionality running locally)

## Purpose

This document provides step-by-step instructions to revert Steno Draft back to the MVP state if enterprise feature development breaks critical functionality. Use this as a safety net before making major changes.

## Current MVP State Overview

### What's Working (MVP Features)
- ✅ User authentication (register/login with JWT)
- ✅ Document upload (PDF, DOCX, images)
- ✅ AI-powered letter generation
- ✅ Template management (CRUD operations)
- ✅ AI refinement of letters
- ✅ Real-time collaboration (WebSocket)
- ✅ Word document export
- ✅ Steno Draft branding (UI/UX rebrand complete)

### Database Schema (5 Migrations)
1. `001_create_users.js` - Users table
2. `002_create_templates.js` - Templates table
3. `003_create_documents.js` - Documents table
4. `004_create_draft_letters.js` - Draft letters table
5. `005_create_sessions.js` - Collaboration sessions table

### Infrastructure
- AWS S3 (3 buckets: documents, processed, exports)
- AWS Lambda (Express serverless function)
- AWS API Gateway
- AWS RDS PostgreSQL (or local PostgreSQL)
- OpenRouter API (GPT-4o for AI)

## Revert Procedures

### Option 1: Git Revert (Recommended - Non-Destructive)

**Use when:** Changes are committed to git and you want to keep history.

```bash
# 1. Check current branch
git branch

# 2. Create a backup branch (safety first)
git checkout -b backup-before-revert-$(date +%Y%m%d)

# 3. Return to main branch
git checkout main

# 4. View recent commits to identify what to revert
git log --oneline -20

# 5. Revert to MVP state (adjust commit hash as needed)
git reset --hard 6b2f3dd  # or 398a3d4 for pre-rebrand state

# 6. Force push ONLY if you're sure (destructive!)
# git push origin main --force
```

**Warning:** `git reset --hard` is destructive. Only use if you're certain.

### Option 2: Git Checkout Specific Commit

**Use when:** You want to view/test MVP without losing current work.

```bash
# 1. Create a new branch from MVP commit
git checkout -b mvp-restore 6b2f3dd

# 2. Test the MVP state
# ... test your application ...

# 3. If MVP works, you can merge or reset main to this branch
# If not, just switch back: git checkout main
```

### Option 3: Manual File Restoration

**Use when:** Only specific files are broken and you know which ones.

```bash
# Restore specific file from MVP commit
git checkout 6b2f3dd -- path/to/file.ts

# Restore entire directory
git checkout 6b2f3dd -- backend/src/handlers/
```

## Database Revert

### If New Migrations Were Added

**Step 1: Identify New Migrations**
```bash
# List all migrations
ls -la backend/migrations/

# MVP migrations (should remain):
# - 001_create_users.js
# - 002_create_templates.js
# - 003_create_documents.js
# - 004_create_draft_letters.js
# - 005_create_sessions.js
```

**Step 2: Rollback New Migrations**
```bash
# Navigate to backend
cd backend

# Rollback last migration (repeat for each new migration)
npx knex migrate:rollback

# Or rollback to specific migration
npx knex migrate:down 006_create_prompts.js
npx knex migrate:down 007_create_draft_letter_versions.js
# ... etc
```

**Step 3: Verify Database State**
```bash
# Connect to database and verify tables
psql -h localhost -U your_user -d demand_letter_generator

# List tables (should only have MVP tables)
\dt

# Expected tables:
# - users
# - templates
# - documents
# - draft_letters
# - sessions
```

### If Database Schema Was Modified

**Option A: Re-run Migrations (Clean)**
```bash
# WARNING: This will delete all data!
# Only use if you have backups or don't need data

# Drop all tables
npx knex migrate:rollback --all

# Re-run MVP migrations
npx knex migrate:up
```

**Option B: Manual SQL Fixes**
```sql
-- Connect to database
psql -h localhost -U your_user -d demand_letter_generator

-- Remove new columns/tables manually
ALTER TABLE users DROP COLUMN IF EXISTS privacy_accepted_at;
DROP TABLE IF EXISTS prompts;
DROP TABLE IF EXISTS draft_letter_versions;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS api_keys;
-- ... etc
```

## Environment Variables Revert

### Check Current .env Files

**Backend .env:**
```bash
# MVP Required Variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=demand_letter_generator
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your-jwt-secret
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=gpt-4o
S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
CORS_ORIGIN=http://localhost:5173
```

**Frontend .env:**
```bash
# MVP Required Variables (if any)
VITE_API_URL=http://localhost:3001/api
```

### Remove Enterprise-Specific Variables

If you added variables for enterprise features, remove or comment them out:
```bash
# Comment out or remove these if they exist:
# ANALYTICS_ENABLED=true
# DEMO_MODE=false
# WEBHOOK_SECRET=...
# API_KEY_ENCRYPTION_KEY=...
```

## Dependencies Revert

### Backend Dependencies

**Check current package.json:**
```bash
cd backend
cat package.json | grep -A 50 "dependencies"
```

**MVP dependencies (should remain):**
- express
- aws-sdk
- pg / knex
- jsonwebtoken
- bcrypt
- axios
- pdf-parse
- mammoth
- docx
- socket.io
- serverless-http

**Remove enterprise-specific packages if added:**
```bash
npm uninstall package-name
# Examples of packages that might be added:
# - recharts (analytics charts)
# - date-fns (advanced date handling)
# - winston (advanced logging)
# - etc.
```

### Frontend Dependencies

**Check current package.json:**
```bash
cd frontend
cat package.json | grep -A 50 "dependencies"
```

**MVP dependencies (should remain):**
- react
- react-router-dom
- axios
- react-toastify
- draft-js
- react-dropzone
- socket.io-client
- tailwindcss

**Remove enterprise-specific packages if added:**
```bash
npm uninstall package-name
# Examples:
# - recharts (analytics)
# - @tanstack/react-table (admin tables)
# - date-fns (advanced dates)
```

## AWS Infrastructure Revert

### If New AWS Resources Were Created

**Step 1: Identify New Resources**
```bash
# List CloudFormation stacks
aws cloudformation list-stacks --region us-east-1

# Describe your stack
aws cloudformation describe-stacks \
  --stack-name demand-letter-generator-staging \
  --region us-east-1
```

**Step 2: Remove New Resources**

**Option A: Update SAM Template**
- Revert `infrastructure/template.yaml` or `template-simple.yaml` to MVP state
- Remove new resources (CloudWatch alarms, SNS topics, etc.)
- Redeploy: `sam deploy`

**Option B: Manual Deletion**
```bash
# Delete specific resources via AWS Console or CLI
# Examples:
aws s3 rb s3://new-bucket-name --force
aws cloudwatch delete-alarm --alarm-name your-alarm
# etc.
```

### S3 Buckets (Should Remain)
- `demand-letter-generator-{env}-documents`
- `demand-letter-generator-{env}-processed`
- `demand-letter-generator-{env}-exports`

**If new buckets were created, delete them:**
```bash
aws s3 rb s3://bucket-name --force
```

## Application Code Revert

### Backend Files to Check

**Core handlers (should exist):**
- `backend/src/handlers/auth.ts`
- `backend/src/handlers/upload.ts`
- `backend/src/handlers/generate.ts`
- `backend/src/handlers/refine.ts`
- `backend/src/handlers/templates.ts`
- `backend/src/handlers/export.ts`
- `backend/src/handlers/drafts.ts`

**Remove if added:**
- `backend/src/handlers/admin/*.ts`
- `backend/src/handlers/prompts.ts`
- `backend/src/handlers/draft-versions.ts`
- `backend/src/handlers/webhooks.ts`
- `backend/src/handlers/user-data.ts`

**Core services (should exist):**
- `backend/src/services/ai-generator.ts`
- `backend/src/services/ai-refiner.ts`
- `backend/src/services/document-processor.ts`
- `backend/src/services/word-exporter.ts`
- `backend/src/services/collaboration.ts`

**Remove if added:**
- `backend/src/services/analytics.ts`
- `backend/src/services/webhook-service.ts`
- `backend/src/services/export-service.ts`

### Frontend Files to Check

**Core pages (should exist):**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Editor.tsx`

**Remove if added:**
- `frontend/src/pages/Admin/*.tsx`
- `frontend/src/pages/PrivacyPolicy.tsx`

**Core components (should exist):**
- `frontend/src/components/DocumentUpload.tsx`
- `frontend/src/components/LetterEditor.tsx`
- `frontend/src/components/TemplateManager.tsx`
- `frontend/src/components/ExportButton.tsx`

**Remove if added:**
- `frontend/src/components/PromptManager.tsx`
- `frontend/src/components/VersionHistory.tsx`
- `frontend/src/components/Charts/*.tsx`
- `frontend/src/components/AdminLayout.tsx`

## Verification Checklist

After reverting, verify MVP functionality:

### 1. Authentication
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token is generated and validated

### 2. Document Upload
- [ ] Can upload PDF document
- [ ] Can upload DOCX document
- [ ] Can upload image files
- [ ] Document processing completes

### 3. Letter Generation
- [ ] Can generate letter from uploaded document
- [ ] AI generates coherent demand letter
- [ ] Template selection works (if implemented)

### 4. Letter Editing
- [ ] Can edit letter content
- [ ] Real-time collaboration works
- [ ] Multiple users can edit simultaneously

### 5. Letter Refinement
- [ ] Can refine letter with instructions
- [ ] AI applies refinements correctly

### 6. Templates
- [ ] Can create template
- [ ] Can edit template
- [ ] Can delete template
- [ ] Template variables work

### 7. Export
- [ ] Can export to Word
- [ ] Word document downloads correctly
- [ ] Document formatting is correct

### 8. UI/UX
- [ ] Steno Draft branding displays correctly
- [ ] All pages load without errors
- [ ] Navigation works
- [ ] Error messages display properly

## Quick Revert Script

Create a script for quick revert (save as `revert-to-mvp.sh`):

```bash
#!/bin/bash
set -e

echo "⚠️  WARNING: This will revert to MVP state!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Backup current state
echo "Creating backup branch..."
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git checkout main

# Revert code
echo "Reverting code to MVP..."
git reset --hard 6b2f3dd

# Revert database (if needed)
echo "Rolling back database migrations..."
cd backend
npx knex migrate:rollback --all || true
npx knex migrate:up || true
cd ..

# Reinstall dependencies
echo "Reinstalling dependencies..."
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

echo "✅ Revert complete! Verify functionality before proceeding."
```

## Emergency Contacts & Resources

- **Git Repository:** Check commit history for specific changes
- **Database Backup:** If you have backups, restore from backup
- **AWS Console:** Check CloudWatch logs for errors
- **Documentation:** See `docs/DEPLOYMENT.md` for setup instructions

## Prevention Tips

Before making major changes:
1. ✅ Create a git branch: `git checkout -b feature/enterprise-features`
2. ✅ Commit current MVP state: `git commit -am "MVP state before enterprise features"`
3. ✅ Tag MVP state: `git tag mvp-v1.0`
4. ✅ Create database backup
5. ✅ Document current environment variables
6. ✅ Test MVP functionality before starting

## Notes

- This document assumes MVP state is at commit `6b2f3dd` (post-rebrand)
- Adjust commit hashes based on your actual git history
- Always test revert in a separate branch first
- Keep backups of database and S3 data if possible
- Document any custom changes you've made beyond MVP

