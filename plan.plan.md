<!-- 570cbcf8-0dde-48c9-bb20-9a707533820e d259fea2-df97-48fc-8543-57eb445df020 -->
# Enterprise-Ready Product Plan for Steno.com Sale

## Executive Summary

Transform Steno Draft into a production-ready, enterprise-grade product with comprehensive admin features, analytics, integration capabilities, and demo-ready functionality for a successful sale presentation to Steno.com.

## Core Principles

- All features must be demo-ready (functional, polished, with sample data)
- Enterprise-grade quality (error handling, monitoring, security)
- Professional UI/UX throughout
- Integration-ready architecture
- Comprehensive analytics and reporting
- Admin dashboard for management and insights

## Phase 1: Foundation & Core Polish (Weeks 1-2)

### 1.1 Auto-Save & Data Persistence

**Priority:** Critical for professional product

- Implement `PATCH /api/drafts/:id` endpoint
- Save full content to S3, summary to database
- Real-time save indicators in UI
- Error handling and retry logic
- Version tracking on each save

**Files:**

- `backend/src/handlers/drafts.ts` - Add PATCH handler
- `backend/src/models/DraftLetter.ts` - Update content persistence
- `frontend/src/pages/Editor.tsx` - Implement handleSave
- `frontend/src/components/LetterEditor.tsx` - Add save status indicators

### 1.2 Template Selection UI

**Priority:** Critical for demo flow

- Add template dropdown in generation section
- Template preview/description
- "No template" option
- Visual template selection cards

**Files:**

- `frontend/src/pages/Editor.tsx` - Template selector component
- Load and display templates during generation

### 1.3 Error Handling & User Feedback

**Priority:** Enterprise requirement

- Comprehensive error boundaries
- User-friendly error messages
- Loading states for all async operations
- Toast notifications for all user actions
- Retry mechanisms for failed operations
- Offline detection and messaging

**Files:**

- `frontend/src/components/ErrorBoundary.tsx` - Create error boundary
- `frontend/src/components/LoadingStates.tsx` - Standardized loading components
- Update all components with proper error handling

### 1.4 Performance Optimization

**Priority:** Enterprise requirement

- API response time monitoring
- Database query optimization
- Frontend bundle optimization
- Lazy loading for components
- Image optimization
- Caching strategies

## Phase 2: Admin Dashboard & Analytics (Weeks 3-4)

### 2.1 Admin Dashboard Foundation

**Priority:** High - Content management first

- Create admin layout and routing
- Role-based access control (admin role)
- Admin navigation and sidebar
- Protected admin routes

**Files:**

- `frontend/src/pages/Admin/Dashboard.tsx`
- `frontend/src/components/AdminLayout.tsx`
- `backend/src/middleware/adminAuth.ts` - Admin authorization

### 2.2 Content Management (Admin Priority #1)

**Priority:** Highest admin feature

- View all firm templates (read-only for admins, or full CRUD)
- View all firm prompts (if implemented)
- View all drafts across users
- Bulk operations (archive, delete)
- Content search and filtering
- Export content reports

**Files:**

- `frontend/src/pages/Admin/ContentManagement.tsx`
- `backend/src/handlers/admin/content.ts` - Admin content endpoints

### 2.3 Usage Analytics Dashboard (Admin Priority #2)

**Priority:** High - Key selling point

- Letters generated (count, trend over time)
- Time saved calculations (estimated hours saved)
- User adoption metrics (active users, new users)
- Template usage statistics
- Collaboration sessions data
- Export frequency
- Cost per letter (API costs)
- ROI calculations

**Files:**

- `backend/src/models/Analytics.ts` - Analytics data model
- `backend/src/handlers/admin/analytics.ts` - Analytics endpoints
- `frontend/src/pages/Admin/Analytics.tsx` - Analytics dashboard
- `frontend/src/components/Charts/` - Chart components (use recharts or similar)

### 2.4 System Health Dashboard (Admin Priority #3)

**Priority:** Medium

- API status and uptime
- Error rates and types
- Performance metrics (response times, DB query times)
- Active users count
- System resource usage (if available)
- Recent errors log

**Files:**

- `backend/src/handlers/admin/health.ts` - Health check endpoints
- `frontend/src/pages/Admin/SystemHealth.tsx` - Health dashboard
- `backend/src/middleware/metrics.ts` - Collect performance metrics

### 2.5 User Management (Admin Priority #4)

**Priority:** Medium

- View all users
- Create/edit users
- Role management (admin, attorney, paralegal)
- User activity tracking
- Deactivate/activate users
- User search and filtering

**Files:**

- `frontend/src/pages/Admin/UserManagement.tsx`
- `backend/src/handlers/admin/users.ts` - User management endpoints
- `backend/src/models/User.ts` - Add role management

## Phase 3: Analytics & Metrics Implementation (Weeks 5-6)

### 3.1 Analytics Data Collection

**Priority:** High

- Track all user actions (letter generation, refinement, export, template creation)
- Store analytics events in database
- Calculate time saved per letter (estimate: 2-4 hours per letter)
- Track collaboration sessions
- Monitor API usage and costs

**Files:**

- `backend/migrations/011_create_analytics_events.js`
- `backend/src/models/AnalyticsEvent.ts`
- `backend/src/services/analytics.ts` - Analytics service
- Integrate analytics tracking in all handlers

### 3.2 Demo Data Generation

**Priority:** Critical for demo

- Seed script to generate realistic demo data
- Pre-populated templates, prompts, drafts
- Sample users (attorney, paralegal, admin)
- Historical analytics data (30-90 days)
- Realistic letter examples
- Collaboration session examples

**Files:**

- `backend/scripts/seed-demo-data.ts`
- `backend/scripts/generate-analytics-history.ts`
- Demo data configuration file

### 3.3 Analytics Visualization

**Priority:** High

- Time saved charts (cumulative, per period)
- User adoption funnel
- Template usage pie charts
- Letter generation trends
- ROI dashboard
- Export charts library (recharts or Chart.js)

**Files:**

- `frontend/src/components/Charts/TimeSavedChart.tsx`
- `frontend/src/components/Charts/UserAdoptionChart.tsx`
- `frontend/src/components/Charts/TemplateUsageChart.tsx`
- `frontend/src/components/Charts/ROIDashboard.tsx`

## Phase 4: Integration Hooks & API (Weeks 7-8)

### 4.1 Webhook System

**Priority:** High for enterprise

- Webhook management UI (create, edit, delete)
- Webhook event types (letter.created, letter.updated, letter.exported, letter.refined)
- Webhook delivery with retry logic
- Webhook secret for security
- Webhook delivery logs
- Test webhook functionality

**Files:**

- `backend/migrations/010_create_webhooks.js`
- `backend/src/models/Webhook.ts`
- `backend/src/handlers/webhooks.ts`
- `backend/src/services/webhook-service.ts`
- `frontend/src/pages/Admin/Webhooks.tsx`

### 4.2 API Authentication & Documentation

**Priority:** High

- API key generation and management
- API key authentication middleware
- Rate limiting per API key
- Comprehensive API documentation
- API usage tracking
- Postman collection for API

**Files:**

- `backend/migrations/012_create_api_keys.js`
- `backend/src/models/ApiKey.ts`
- `backend/src/middleware/apiAuth.ts`
- `frontend/src/pages/Admin/ApiKeys.tsx`
- `docs/API_INTEGRATION.md` - Enhanced API docs
- `docs/postman-collection.json`

### 4.3 Data Export Formats

**Priority:** Medium

- JSON export for all data types
- CSV export for analytics
- Bulk export functionality
- Scheduled exports (future)
- Export history

**Files:**

- `backend/src/handlers/admin/export.ts`
- `backend/src/services/export-service.ts`
- `frontend/src/pages/Admin/DataExport.tsx`

### 4.4 SSO-Ready Architecture

**Priority:** Medium

- OAuth2 provider structure (prepared, not fully implemented)
- JWT token structure compatible with SSO
- User identity abstraction
- Documentation for SSO integration

**Files:**

- `docs/SSO_INTEGRATION_GUIDE.md`
- Update authentication to support future SSO

## Phase 5: Demo Mode & Demo Guide (Week 8)

### 5.1 Demo Mode Implementation

**Priority:** Critical

- Demo mode toggle (environment variable or UI toggle)
- Pre-populated demo data
- Demo user accounts
- Demo script automation (optional)
- Reset demo data functionality

**Files:**

- `backend/src/middleware/demoMode.ts`
- `frontend/src/contexts/DemoContext.tsx`
- Demo mode indicators in UI

### 5.2 Comprehensive Demo Guide

**Priority:** Critical

- Short demo script (15-20 minutes)
- Long demo script (45-60 minutes)
- Key talking points for each feature
- Value proposition emphasis:

1. Time savings (50%+ reduction, show metrics)
2. Consistency (firm-wide standardization)
3. Collaboration (real-time attorney/paralegal)
4. AI quality (professional output)

- Demo flow diagrams
- Troubleshooting guide
- Q&A preparation

**Files:**

- `docs/DEMO_GUIDE.md` - Comprehensive demo guide
- `docs/DEMO_SCRIPT_SHORT.md` - 15-20 min version
- `docs/DEMO_SCRIPT_LONG.md` - 45-60 min version
- `docs/DEMO_TALKING_POINTS.md` - Key messages

### 5.3 Demo Environment Setup

**Priority:** Critical

- Production-ready hosting setup
- Demo environment configuration
- Sample data seeding instructions
- Environment variable documentation
- Deployment checklist

**Files:**

- `docs/DEMO_ENVIRONMENT_SETUP.md`
- Update deployment documentation

## Phase 6: Polish & Enterprise Features (Weeks 9-10)

### 6.1 Customizable AI Prompts

**Priority:** Medium (P1 requirement)

- Prompt management system
- Firm-level prompt customization
- Prompt templates library
- Integration with generation/refinement

**Files:**

- `backend/migrations/006_create_prompts.js`
- `backend/src/models/Prompt.ts`
- `backend/src/handlers/prompts.ts`
- `frontend/src/components/PromptManager.tsx`

### 6.2 Version History

**Priority:** Medium

- Version tracking and viewing
- Version comparison
- Restore previous versions
- Version history UI

**Files:**

- `backend/migrations/007_create_draft_letter_versions.js`
- `backend/src/models/DraftLetterVersion.ts`
- `backend/src/handlers/draft-versions.ts`
- `frontend/src/components/VersionHistory.tsx`

### 6.3 Compliance Features

**Priority:** Medium

- GDPR data export
- Privacy policy integration
- Data retention policies (basic)
- User data deletion

**Files:**

- `backend/migrations/008_add_privacy_acceptance_to_users.js`
- `backend/src/handlers/user-data.ts`
- `frontend/src/pages/PrivacyPolicy.tsx`

## Implementation Priorities

### Must-Have for Demo (Weeks 1-8)

1. Auto-save functionality
2. Template selection UI
3. Error handling & polish
4. Admin dashboard (all 4 sections)
5. Analytics with demo data
6. Webhook system (demo-able)
7. API documentation
8. Demo mode & guide

### Should-Have (Weeks 9-10)

9. Customizable AI prompts
10. Version history
11. Compliance features

### Nice-to-Have (Post-sale)

12. Advanced data retention
13. Full SSO implementation
14. Scheduled exports

## Success Metrics

### Technical Metrics

- API response times < 2s (95th percentile)
- Zero critical bugs in demo flow
- 100% feature demo-ability
- Professional UI/UX throughout

### Business Metrics (for demo)

- Time saved: 2-4 hours per letter
- ROI: Calculate based on attorney hourly rate
- User adoption: Show growth metrics
- Cost per letter: API costs vs time saved

## Testing & Deployment Strategy

### Local Development & Testing

**Purpose:** Fast development iteration and feature testing
**Setup:**

- Docker Compose for PostgreSQL (simplest setup)
- Local S3 emulation (optional) or direct AWS S3 access
- Local frontend dev server (Vite)
- Local backend server (Express)
- Environment: `.env.local` for development

**User Scenario Testing:**

- Quick feature validation
- Development debugging
- Unit/integration testing
- Not suitable for full demo

### Cloud Staging/Demo Environment

**Purpose:** Full user scenario testing, demo preparation, and actual demo
**Setup:**

- AWS Lambda functions (backend)
- AWS API Gateway (REST API)
- AWS RDS PostgreSQL (database)
- AWS S3 buckets (storage)
- CloudFront + S3 (frontend hosting)
- Environment: `staging` or `demo` environment

**User Scenario Testing:**

- Complete end-to-end workflows
- Real-world performance testing
- Demo preparation and practice
- Actual Steno.com demo presentation

**Deployment Process:**

1. Build frontend → Deploy to S3/CloudFront
2. Build backend → Deploy Lambda functions via SAM
3. Run database migrations
4. Seed demo data
5. Configure environment variables
6. Test all user scenarios
7. Verify demo flow

## AWS Services Breakdown

### Currently Used Services

1. **AWS S3 (Simple Storage Service)**

- **Purpose:** File storage for documents, processed content, and exports
- **Buckets:**
 - `demand-letter-generator-{env}-documents` - Uploaded source documents
 - `demand-letter-generator-{env}-processed` - Processed text from documents
 - `demand-letter-generator-{env}-exports` - Exported Word documents
- **Features Used:**
 - Object storage (PutObject, GetObject, DeleteObject)
 - Presigned URLs for secure downloads
 - Versioning (enabled)
 - Lifecycle policies (auto-delete old exports after 30 days)
 - Bucket creation (auto-created if missing)

2. **AWS Lambda**

- **Purpose:** Serverless backend API functions
- **Current Setup:**
 - Individual Lambda functions per endpoint (template.yaml)
 - OR single Express Lambda function (template-simple.yaml)
- **Configuration:**
 - Runtime: Node.js 18.x
 - Memory: 512MB (individual) or 1024MB (Express)
 - Timeout: 30 seconds
 - IAM role with S3 access

3. **AWS API Gateway**

- **Purpose:** REST API endpoint management
- **Features:**
 - CORS configuration
 - Request routing to Lambda
 - Stage management (dev, staging, prod)
 - Custom domain support (optional)

4. **AWS RDS (Relational Database Service)**

- **Purpose:** PostgreSQL database for application data
- **Current Setup:**
 - PostgreSQL 14+ (recommended)
 - Can use db.t3.micro (free tier eligible)
 - Managed by AWS (backups, scaling)
- **Data Stored:**
 - Users, authentication
 - Templates, prompts
 - Draft letters metadata
 - Analytics events
 - Sessions, webhooks, API keys

5. **AWS IAM (Identity and Access Management)**

- **Purpose:** Security and permissions
- **Roles:**
 - LambdaExecutionRole - Grants Lambda access to S3
- **Policies:**
 - S3 read/write/delete access
 - CloudWatch Logs access (automatic)
 - Secrets Manager access (for OpenRouter key)

6. **AWS Secrets Manager**

- **Purpose:** Secure storage of sensitive credentials
- **Current Use:**
 - OpenRouter API key storage
- **Benefits:**
 - Encryption at rest
 - Automatic rotation (optional)
 - Access via IAM policies

7. **AWS CloudWatch (Implied)**

- **Purpose:** Logging and monitoring
- **Automatic:**
 - Lambda function logs
 - API Gateway logs
- **To Add:**
 - Custom metrics (API response times, error rates)
 - Alarms for errors
 - Dashboard for system health

### Additional AWS Services Needed for Enterprise

8. **AWS CloudFront**

- **Purpose:** CDN and frontend hosting
- **Use Case:**
 - Serve React frontend from S3
 - Global content delivery
 - HTTPS/SSL certificates
 - Custom domain support

9. **AWS VPC (Virtual Private Cloud)**

- **Purpose:** Network isolation (if RDS needs private access)
- **Current:** May not be needed if using public RDS endpoint
- **Future:** Consider for production security

10. **AWS Route 53 (Optional)**

 - **Purpose:** Custom domain management
 - **Use Case:** Professional domain for demo (e.g., stenodraft-demo.com)

11. **AWS SNS/SQS (Future - Optional)**

 - **Purpose:** Async processing and notifications
 - **Use Case:** Background jobs, webhook delivery queue

## OpenRouter Services Breakdown

### Currently Used Services

1. **OpenRouter Chat Completions API**

- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Purpose:** AI-powered document analysis and letter generation
- **Model:** GPT-4o (default, configurable)
- **Use Cases:**
 - **Document Analysis** (`AIGenerator.analyzeDocument`)
 - Extract facts, parties, damages, dates, legal basis
 - JSON response format
 - Max tokens: 2000
 - **Letter Generation** (`AIGenerator.generateLetter`)
 - Generate demand letters from analysis
 - Template support
 - Max tokens: 4000
 - Temperature: 0.7
 - **Letter Refinement** (`AIRefiner.refineLetter`)
 - Refine letters based on attorney instructions
 - Maintain legal accuracy
 - Max tokens: 4000
 - Temperature: 0.7

2. **OpenRouter Vision API (GPT-4o Vision)**

- **Purpose:** OCR for image documents
- **Use Case:** Extract text from JPEG, PNG, GIF, WEBP images
- **Implementation:** Via document-processor.ts using GPT-4o with image support

3. **OpenRouter API Authentication**

- **Method:** Bearer token in Authorization header
- **Storage:** AWS Secrets Manager (production) or environment variable (local)
- **Headers:**
 - `Authorization: Bearer {OPENROUTER_API_KEY}`
 - `HTTP-Referer: https://github.com/steno/demand-letter-generator`
 - `X-Title: Demand Letter Generator`

### OpenRouter Costs & Considerations

- **Pricing:** Pay-per-use based on tokens
- **Rate Limits:** Check OpenRouter documentation
- **Monitoring:** Track API usage for cost management
- **Fallback:** Consider error handling for API failures

## Missing Services & Considerations

### Should Add for Enterprise/Demo

1. **CloudWatch Metrics & Alarms**

- Custom metrics for API performance
- Error rate monitoring
- Cost tracking
- Alarms for critical issues

2. **CloudFront for Frontend**

- Currently frontend deployment not fully specified
- Need S3 bucket + CloudFront distribution
- SSL certificate management

3. **WebSocket Support (if needed)**

- Current: Socket.io for real-time collaboration
- Lambda + API Gateway WebSocket API (if moving away from Socket.io)
- Or keep Socket.io with separate WebSocket server

4. **Database Backup Strategy**

- RDS automated backups (should configure)
- Point-in-time recovery
- Backup retention policy

5. **Monitoring & Alerting**

- CloudWatch dashboards
- SNS for alerts
- Health check endpoints

6. **Cost Management**

- AWS Cost Explorer integration
- Budget alerts
- Resource tagging for cost allocation

## Deliverables

1. **Production-ready application** (hosted, consumable)
2. **Admin dashboard** (content, analytics, health, users)
3. **Comprehensive analytics** (with demo data)
4. **Integration hooks** (webhooks, API, export)
5. **Demo guide** (short/long versions)
6. **API documentation** (for integrations)
7. **Demo environment** (with seed data)
8. **Deployment documentation** (local and cloud setup)
9. **User scenario testing guide** (what to test and where)

## Risk Mitigation

- Test all demo flows thoroughly
- Have backup demo data ready
- Prepare troubleshooting guide
- Document all known limitations
- Create FAQ for common questions
- Monitor AWS costs during development
- Set up CloudWatch alarms for critical errors
- Document all AWS service dependencies

### To-dos

- [x] Set up brand colors and typography (CSS variables, Tailwind config, Google Fonts)
- [x] Create favicon and update index.html
- [x] Rebrand all UI text in frontend components (Home, Editor, Login, etc.)
- [x] Update toast notifications with lawyer-friendly language
- [x] Update placeholders, empty states, and loading messages
- [x] Apply new color scheme and design patterns throughout UI
- [x] Update USER_GUIDE.md with Steno Draft branding
- [x] Add onboarding/welcome messaging and improve Login/Registration pages
- [ ] Create PATCH /api/drafts/:id endpoint for auto-saving draft content
- [ ] Implement handleSave in Editor.tsx to call auto-save endpoint
- [ ] Create prompts table migration and PromptModel
- [ ] Create prompt management API handlers (GET/POST/PUT/DELETE /api/prompts)
- [ ] Create PromptManager component and integrate into generation/refinement flows
- [ ] Add template dropdown selector in Editor generation section
- [ ] Create draft_letter_versions table migration and model
- [ ] Create version history API endpoints and snapshot on save
- [ ] Create VersionHistory component and integrate into editor
- [ ] Implement user data export endpoint (GET /api/user/data-export)
- [ ] Add privacy policy acceptance on registration and create privacy page
- [ ] Create data retention policies system and admin UI
- [ ] Implement webhook system for external integrations