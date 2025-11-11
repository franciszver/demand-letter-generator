# Revert to MVP Plan

This document captures the current MVP state of the Demand Letter Generator application, including all code, configuration, and AWS infrastructure setup. Use this as a reference point to revert to the MVP state if needed.

## Current MVP State (as of this document creation)

### Architecture Overview

**Frontend:**
- React (TypeScript) with Vite build tool
- Tailwind CSS for styling
- React Context API for state management
- React Router for navigation
- Socket.io client for real-time collaboration
- Location: `frontend/`

**Backend:**
- Node.js/Express (TypeScript) REST API
- Serverless-http wrapper for Lambda compatibility
- Location: `backend/`

**Database:**
- PostgreSQL 14+ with Knex.js migrations
- Local development: Docker Compose setup
- Production: AWS RDS PostgreSQL
- Location: `backend/migrations/`

**Storage:**
- AWS S3 for document storage (3 buckets: documents, processed, exports)
- Full document text and letter content stored in S3
- Metadata stored in PostgreSQL

**AI Integration:**
- OpenRouter API with GPT-4o model
- Document analysis and letter generation
- Letter refinement based on instructions

**Infrastructure:**
- AWS Lambda functions (serverless)
- API Gateway REST API
- AWS SAM for infrastructure as code
- Location: `infrastructure/`

**Real-time Collaboration:**
- Socket.io WebSocket server
- Real-time editing and user presence tracking
- Session management

### Database Schema (MVP)

**Tables:**
1. `users` - User authentication and profiles
   - id (UUID), email, password_hash, name, role (admin/attorney/paralegal)
   - Created by: `backend/migrations/001_create_users.js`

2. `templates` - Firm-specific demand letter templates
   - id (UUID), name, content, variables (JSON), version
   - Created by: `backend/migrations/002_create_templates.js`

3. `documents` - Uploaded source documents metadata
   - id (UUID), user_id, filename, original_name, file_type, file_size, s3_key, extracted_text, status
   - Created by: `backend/migrations/003_create_documents.js`

4. `draft_letters` - Generated and refined demand letters
   - id (UUID), user_id, document_id, template_id, title, content_summary, s3_key, version, status
   - Created by: `backend/migrations/004_create_draft_letters.js`

5. `sessions` - Real-time collaboration sessions
   - id (UUID), draft_letter_id, user_id, is_active, last_activity
   - Created by: `backend/migrations/005_create_sessions.js`

### API Endpoints (MVP)

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

**Document Management:**
- `POST /api/upload` - Upload source documents (PDF, DOCX, images)
- `GET /api/documents/:id` - Get document details

**Letter Generation:**
- `POST /api/generate` - Generate draft letter from document
- `POST /api/refine` - Refine draft letter with AI instructions
- `GET /api/drafts` - List user's draft letters
- `GET /api/drafts/:id` - Get draft letter details

**Templates:**
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

**Export:**
- `POST /api/export` - Export draft letter to Word format

**Health:**
- `GET /health` - Health check endpoint

### AWS Infrastructure (MVP)

**SAM Template:** `infrastructure/template.yaml`

**Resources:**
- 3 S3 Buckets:
  - `demand-letter-generator-{Environment}-documents` - Uploaded documents
  - `demand-letter-generator-{Environment}-processed` - Processed content
  - `demand-letter-generator-{Environment}-exports` - Exported Word documents

- Lambda Functions:
  - `UploadHandler` - Document upload processing
  - `GenerateHandler` - AI letter generation
  - `RefineHandler` - Letter refinement
  - `TemplatesHandler` - Template CRUD operations
  - `ExportHandler` - Word document export

- IAM Role: `LambdaExecutionRole` with S3 and Secrets Manager access
- Secrets Manager: `OpenRouterSecret` for API key storage
- API Gateway: REST API with CORS configuration

**Configuration:**
- SAM Config: `infrastructure/samconfig.toml`
- Default region: `us-east-1`
- Stack name: `demand-letter-generator-dev`

### Environment Variables (MVP)

**Backend (.env):**
```
DB_HOST=localhost (or RDS endpoint)
DB_PORT=5432
DB_NAME=demand_letter_generator
DB_USER=postgres (or RDS username)
DB_PASSWORD=postgres (or RDS password)
JWT_SECRET=<strong-random-secret>
OPENROUTER_API_KEY=<your-key>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
S3_BUCKET_DOCUMENTS=demand-letter-generator-dev-documents
S3_BUCKET_PROCESSED=demand-letter-generator-dev-processed
S3_BUCKET_EXPORTS=demand-letter-generator-dev-exports
CORS_ORIGIN=*
```

### Key Files and Directories

**Backend:**
- `backend/src/index.ts` - Express server setup
- `backend/src/handlers/` - API route handlers
- `backend/src/services/` - Business logic services
- `backend/src/models/` - Database models
- `backend/src/middleware/` - Auth, rate limiting, error handling
- `backend/src/config/` - Database and S3 configuration

**Frontend:**
- `frontend/src/App.tsx` - Main application component
- `frontend/src/pages/` - Page components
- `frontend/src/components/` - Reusable components
- `frontend/src/contexts/` - React contexts (Auth)
- `frontend/src/services/` - API client and WebSocket

**Infrastructure:**
- `infrastructure/template.yaml` - AWS SAM template
- `infrastructure/samconfig.toml` - SAM deployment config

**Shared:**
- `shared/types/index.ts` - TypeScript types shared between frontend/backend

### Features Implemented (MVP)

**P0 - Must-Have (100% Complete):**
- ✅ Document upload (PDF, DOCX, images)
- ✅ AI-powered draft letter generation
- ✅ Firm-specific template management
- ✅ AI refinement based on instructions
- ✅ Word document export

**P1 - Should-Have (75% Complete):**
- ✅ Real-time collaboration with change tracking
- ⚠️ Customizable AI prompts (partially implemented)

**Additional MVP Features:**
- ✅ User authentication (JWT)
- ✅ Role-based access control (admin, attorney, paralegal)
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Error handling middleware

### Deployment Status (MVP)

**Local Development:**
- PostgreSQL via Docker Compose
- Express server on port 3001
- Vite dev server on port 5173
- Local S3 setup available

**AWS Deployment:**
- Infrastructure ready via SAM templates
- Lambda functions configured
- S3 buckets configured
- API Gateway configured
- RDS PostgreSQL required (not in SAM template)

### Dependencies (MVP)

**Backend (package.json):**
- express, cors, jsonwebtoken, bcryptjs
- multer, pdf-parse, mammoth, docx
- pg, knex, aws-sdk
- socket.io, serverless-http
- axios, uuid

**Frontend (package.json):**
- react, react-dom, react-router-dom
- axios, socket.io-client
- draft-js, react-toastify, react-dropzone
- tailwindcss, vite

### How to Revert to MVP

1. **Checkout MVP commit/tag** (if tagged):
   ```bash
   git checkout <mvp-tag-or-commit>
   ```

2. **Restore database schema:**
   ```bash
   cd backend
   npm run migrate:rollback  # Rollback any Phase 3 migrations
   npm run migrate          # Ensure MVP migrations are applied
   ```

3. **Restore AWS infrastructure:**
   ```bash
   cd infrastructure
   sam build
   sam deploy --guided  # Use MVP template.yaml
   ```

4. **Restore environment variables:**
   - Copy `.env.example` to `.env` in backend/
   - Use MVP configuration values

5. **Rebuild and redeploy:**
   ```bash
   # Backend
   cd backend
   npm install
   npm run build
   
   # Frontend
   cd frontend
   npm install
   npm run build
   ```

6. **Verify MVP features:**
   - Test document upload
   - Test letter generation
   - Test template management
   - Test refinement
   - Test export
   - Test real-time collaboration

### Notes

- This MVP state represents ~90% PRD completion
- All P0 requirements are fully implemented
- Real-time collaboration is fully functional
- System is production-ready for core use cases
- Phase 3 features (admin dashboard, metrics, EQ data, tone meters) are NOT included in MVP

### Version Information

- Node.js: 18+
- PostgreSQL: 14+
- React: 18.2.0
- TypeScript: 5.3.3
- AWS SAM: Latest
- OpenRouter API: GPT-4o model

---

**Document Created:** [Current Date]
**Purpose:** Reference for reverting to MVP state before Phase 3 implementation
**Status:** MVP Complete - Ready for Phase 3 Development

