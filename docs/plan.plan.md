<!-- bcea9174-4cd9-40d1-9a19-b09f1c90189e 43fc37c7-3dfd-49fa-a62b-849d482fcb6a -->
# Demand Letter Generator - Implementation Plan

## Architecture Overview

**Frontend:** React (TypeScript) with modern UI components
**Backend:** Node.js/Express (TypeScript) REST API
**Database:** PostgreSQL for data persistence
**Storage:** AWS S3 for document storage
**AI:** OpenRouter API with GPT-4o model
**Compute:** AWS Lambda functions (serverless)
**Deployment:** Local development + AWS (S3/CloudFront frontend, Lambda backend)

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Project Structure

- Create monorepo structure with `frontend/`, `backend/`, `infrastructure/` directories
- Set up TypeScript configuration for both frontend and backend
- Initialize package.json files with dependencies
- Create `.env.example` files for configuration

### 1.2 Database Setup

- Design PostgreSQL schema:
- `users` table (authentication)
- `firms` table (firm-specific settings)
- `templates` table (firm demand letter templates)
- `documents` table (uploaded source documents metadata)
- `draft_letters` table (generated and refined letters)
- `sessions` table (for real-time collaboration)
- Create migration files using Knex.js (simple and clean)
- Set up database connection pooling

### 1.3 AWS Infrastructure Setup

- Create S3 buckets: `documents/`, `processed/`, `exports/`
- Set up IAM roles and policies for Lambda functions
- Configure AWS Secrets Manager for API keys
- Set up API Gateway structure
- Create Lambda function templates

## Phase 2: Backend Implementation

### 2.1 Core Services

**File:** `backend/src/services/document-processor.ts`

- Implement file upload handler (multipart/form-data)
- Support PDF (pdf-parse), DOCX (mammoth), images (OpenAI Vision API)
- Extract text content and store in S3
- Return document ID and extracted content

**File:** `backend/src/services/ai-generator.ts`

- Integrate OpenRouter API client
- Implement document analysis prompt (extract facts, parties, damages, dates, legal basis)
- Implement letter generation prompt (use template structure, professional tone)
- Apply firm-specific templates when provided
- Return draft with citations/references

**File:** `backend/src/services/ai-refiner.ts`

- Accept draft letter and refinement instructions
- Use OpenRouter API to refine based on instructions
- Maintain legal accuracy and professional tone
- Return refined draft

**File:** `backend/src/services/word-exporter.ts`

- Use `docx` library to generate Word documents
- Apply proper formatting (headers, paragraphs, spacing)
- Include citations and references
- Generate downloadable .docx file

### 2.2 API Handlers (Lambda Functions)

**File:** `backend/src/handlers/upload.ts`

- POST /api/upload - Validate file type/size, process document, store metadata in PostgreSQL
- Return document ID and status

**File:** `backend/src/handlers/generate.ts`

- POST /api/generate - Accept document ID and optional template ID
- Generate draft letter using AI service
- Store draft in PostgreSQL
- Return draft content

**File:** `backend/src/handlers/refine.ts`

- POST /api/refine - Accept draft ID and refinement instructions
- Refine letter using AI service
- Update draft in database
- Return refined draft

**File:** `backend/src/handlers/templates.ts`

- GET /api/templates - List all templates for a firm
- POST /api/templates - Create new template
- PUT /api/templates/:id - Update template
- DELETE /api/templates/:id - Delete template
- Store templates in PostgreSQL with versioning support

**File:** `backend/src/handlers/export.ts`

- POST /api/export - Accept draft content
- Generate Word document
- Upload to S3 exports bucket
- Return presigned download URL

### 2.3 Real-time Collaboration (P1)

**File:** `backend/src/services/collaboration.ts`

- Implement WebSocket server (using Socket.io or AWS API Gateway WebSocket)
- Track document sessions in PostgreSQL
- Handle concurrent edits with operational transforms or conflict resolution
- Broadcast changes to all connected clients
- Implement change tracking

**File:** `backend/src/handlers/collaboration.ts`

- WebSocket connection handler
- Session management
- Change synchronization

### 2.4 Authentication & Security

- Implement JWT-based authentication
- Add middleware for route protection
- Encrypt sensitive data at rest
- Use presigned URLs for S3 access
- Implement rate limiting
- Add audit logging for compliance

## Phase 3: Frontend Implementation

### 3.1 Core Components

**File:** `frontend/src/components/DocumentUpload.tsx`

- Drag-and-drop file upload interface
- File type validation (PDF, DOCX, images)
- Progress indicator during upload
- Preview uploaded documents
- File size limit enforcement

**File:** `frontend/src/components/LetterEditor.tsx`

- Rich text editor (using Draft.js or similar)
- AI refinement input field
- Real-time preview of changes
- Change tracking display (for collaboration)
- Save draft functionality

**File:** `frontend/src/components/TemplateManager.tsx`

- List firm templates in a table/cards
- Create/edit template form with rich text editor
- Template variable/placeholder support
- Apply template to draft functionality
- Template versioning display

**File:** `frontend/src/components/ExportButton.tsx`

- Export to Word button
- Download progress indicator
- Success/error notifications

### 3.2 Pages

**File:** `frontend/src/pages/Home.tsx`

- Landing page with upload interface
- Recent drafts list
- Quick access to templates

**File:** `frontend/src/pages/Editor.tsx`

- Full editor view with document upload
- Letter generation interface
- Refinement panel
- Export controls
- Collaboration indicators (if P1 enabled)

### 3.3 Services & State Management

**File:** `frontend/src/services/api.ts`

- API client with axios/fetch
- Error handling
- Request/response interceptors
- Type definitions for API responses

**File:** `frontend/src/services/websocket.ts` (P1)

- WebSocket client connection
- Real-time update handlers
- Change synchronization logic

### 3.4 UI/UX

- Implement responsive design
- Add loading states and error handling
- Create accessible components (WCAG compliance)
- Use consistent design patterns
- Add user feedback (toasts, notifications)

## Phase 4: Integration & Testing

### 4.1 Integration Testing

- Test document upload flow (all formats)
- Test AI generation quality and accuracy
- Test refinement functionality
- Test Word export formatting
- Test template management CRUD operations
- Test real-time collaboration (multiple users)
- End-to-end workflow testing

### 4.2 Performance Optimization

- Optimize database queries (<2s requirement)
- Implement caching where appropriate
- Optimize API response times (<5s requirement)
- Add pagination for large lists
- Optimize file upload handling

### 4.3 Error Handling

- Comprehensive error messages
- Graceful degradation
- Retry logic for API calls
- User-friendly error notifications

## Phase 5: Deployment

### 5.1 Local Development Setup

- Create docker-compose.yml for PostgreSQL
- Set up local environment variables
- Create development scripts
- Document local setup process

### 5.2 AWS Deployment

- Deploy Lambda functions using AWS SAM or Serverless Framework
- Configure API Gateway endpoints
- Deploy frontend to S3 with CloudFront distribution
- Set up environment variables in AWS
- Configure CORS properly
- Set up monitoring and logging (CloudWatch)

### 5.3 Documentation

- API documentation (OpenAPI/Swagger)
- User guide for attorneys
- Template creation guide
- Deployment guide
- README with setup instructions

## Key Technical Decisions

- **Architecture:** Single-firm (no multi-tenancy)
- **Database:** PostgreSQL (per PRD requirement) - metadata only, full content in S3
- **Backend:** Node.js/Express with TypeScript, Lambda-ready (serverless-first)
- **Frontend:** React with Tailwind CSS
- **AI:** OpenRouter API with GPT-4o model
- **File Processing:** pdf-parse (PDF), mammoth (DOCX), OpenAI Vision (images)
- **File Size Limit:** 50MB maximum upload
- **Storage Strategy:** Full document text and letter content in S3, metadata in PostgreSQL
- **Template Format:** Plain text with variable placeholders ({{variable_name}})
- **Word Export:** docx library
- **Real-time Collaboration:** Basic level (presence tracking, change history, no operational transforms)
- **WebSocket:** Socket.io or AWS API Gateway WebSocket
- **Authentication:** JWT tokens (simple auth for MVP)
- **Error Handling:** Environment-aware (user-friendly in production, detailed in dev)
- **Testing:** Basic unit tests for critical functions
- **CORS:** Configurable, localhost for development
- **Deployment:** AWS SAM/Serverless Framework for infrastructure as code

## Success Criteria

- ✅ Upload and process documents (PDF, DOCX, images)
- ✅ Generate accurate demand letter drafts using AI
- ✅ Refine letters based on attorney instructions
- ✅ Export to Word format with proper formatting
- ✅ Manage firm templates (CRUD operations)
- ✅ Real-time collaboration with change tracking
- ✅ Secure document storage and access
- ✅ Meet performance requirements (<5s API, <2s DB)
- ✅ Handle errors gracefully
- ✅ Deploy to AWS successfully

### To-dos

- [ ] Initialize project structure with frontend, backend, and infrastructure directories. Set up TypeScript configs and package.json files.
- [ ] Design PostgreSQL schema (users, firms, templates, documents, draft_letters, sessions). Create migration files and set up connection pooling.
- [ ] Create S3 buckets, IAM roles, AWS Secrets Manager setup, API Gateway structure, and Lambda function templates.
- [ ] Implement core services: document-processor, ai-generator, ai-refiner, word-exporter with OpenRouter API integration.
- [ ] Create Lambda handlers for upload, generate, refine, templates, and export endpoints with PostgreSQL integration.
- [ ] Implement real-time collaboration service with WebSocket support, session management, and change tracking.
- [ ] Implement JWT authentication, route protection middleware, encryption, rate limiting, and audit logging.
- [ ] Build React components: DocumentUpload, LetterEditor, TemplateManager, ExportButton with TypeScript.
- [ ] Create Home and Editor pages with full workflow integration and UI/UX polish.
- [ ] Implement WebSocket client for real-time collaboration, change synchronization, and collaboration UI indicators.
- [ ] Test end-to-end workflows: document upload, AI generation, refinement, export, templates, and collaboration.
- [ ] Optimize database queries, API response times, implement caching, and ensure <5s API and <2s DB requirements.
- [ ] Set up local development environment with docker-compose for PostgreSQL, environment variables, and dev scripts.
- [ ] Deploy Lambda functions via AWS SAM/Serverless, deploy frontend to S3/CloudFront, configure API Gateway and monitoring.
- [ ] Create API documentation, user guide, template creation guide, deployment guide, and comprehensive README.