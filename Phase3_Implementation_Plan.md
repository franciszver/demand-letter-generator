# Phase 3 Implementation Plan

## Overview

This plan implements Phase 3 features on top of the existing MVP, focusing on:
1. Enhanced account generation (primary/secondary users)
2. Admin dashboard with time-saved metrics
3. Human data collection for EQ enhancement (both user profile + case-specific)
4. Refinement history tracking
5. Tone/content/structure measurement meters (best practices)
6. Docker-based cloud deployment and hosting

## Current State Analysis

**MVP Status:** ~90% PRD completion
- ✅ All P0 features implemented
- ✅ Real-time collaboration working
- ⚠️ Customizable AI prompts partially implemented
- ❌ Phase 3 features not implemented

**Architecture:**
- Frontend: React + TypeScript + Vite
- Backend: Node.js/Express + TypeScript (Lambda-ready)
- Database: PostgreSQL with Knex migrations
- Storage: AWS S3
- Infrastructure: AWS SAM templates

## Phase 3 Features to Implement

### 1. Enhanced Account Generation
- **Primary Users (Attorneys):** Full access, can create secondary users
- **Secondary Users (Paralegals):** Limited access, assigned by primary users
- **Admin Users:** System-wide access, metrics dashboard

### 2. Admin Dashboard
- Time saved metrics (litigation process efficiency)
- User activity analytics
- Letter generation statistics
- System-wide performance metrics

### 3. Human Data Collection for EQ (Both User Profile + Case-Specific)
- **User Profile Data:**
  - Communication style preferences
  - Preferred tone (formal/informal, assertive/passive)
  - Formality level preferences
  - Historical letter patterns
- **Case-Specific Context:**
  - Relationship dynamics with recipient
  - Urgency level
  - Previous interactions/communications
  - Case sensitivity/confidentiality level
  - Target recipient information (role, organization, relationship)

### 4. Refinement History Tracking
- Track all AI refinement prompts and responses
- Version history with change tracking
- User attribution for refinements
- Prompt effectiveness metrics

### 5. Tone/Content/Structure Meters (Best Practices)
- **Core Metrics (1-10 scale):**
  - Intensity meter (1-10) - Strength/forcefulness of language
  - Seriousness meter (1-10) - Gravity/severity of tone
  - Formality meter (1-10) - Professional/casual level
- **Additional Metrics (Best Practices):**
  - Clarity score (1-10) - Readability and comprehension
  - Persuasiveness (1-10) - Argument strength
  - Empathy level (1-10) - Emotional intelligence in communication
  - Structure quality (1-10) - Organization and flow
  - Legal precision (1-10) - Accuracy of legal language
- **Real-time Features:**
  - Live calculation as user types/edits
  - Before/after comparison during refinement
  - Visual indicators (color-coded meters)
  - Suggestions for improvement

## Implementation Phases

### Phase 3.1: Database Schema Extensions

**New Migrations:**
- `006_create_user_profiles.js` - Extended user data for EQ
- `007_create_refinement_history.js` - Track AI refinement prompts
- `008_create_letter_metrics.js` - Tone/content/structure measurements
- `009_create_time_tracking.js` - Time saved calculations
- `010_create_user_relationships.js` - Primary/secondary user relationships

**Files to Create:**
- `backend/migrations/006_create_user_profiles.js`
- `backend/migrations/007_create_refinement_history.js`
- `backend/migrations/008_create_letter_metrics.js`
- `backend/migrations/009_create_time_tracking.js`
- `backend/migrations/010_create_user_relationships.js`

### Phase 3.2: Backend Models & Services

**New Models:**
- `backend/src/models/UserProfile.ts` - EQ user data
- `backend/src/models/RefinementHistory.ts` - AI prompt history
- `backend/src/models/LetterMetrics.ts` - Tone/content measurements
- `backend/src/models/TimeTracking.ts` - Time saved calculations
- `backend/src/models/UserRelationship.ts` - Primary/secondary relationships

**New Services:**
- `backend/src/services/metrics-calculator.ts` - Calculate tone/content metrics (all 8 metrics)
- `backend/src/services/time-tracker.ts` - Track and calculate time saved (automated + user input)
- `backend/src/services/eq-enhancer.ts` - Use human data to improve letter generation
- `backend/src/services/admin-analytics.ts` - Admin dashboard data

**Enhanced Services:**
- `backend/src/services/ai-generator.ts` - Incorporate EQ data (user profile + case context)
- `backend/src/services/ai-refiner.ts` - Track refinement history

### Phase 3.3: API Endpoints

**New Handlers:**
- `backend/src/handlers/user-profiles.ts` - User profile CRUD
- `backend/src/handlers/admin.ts` - Admin dashboard endpoints
- `backend/src/handlers/metrics.ts` - Letter metrics endpoints
- `backend/src/handlers/user-relationships.ts` - Primary/secondary user management

**Enhanced Handlers:**
- `backend/src/handlers/generate.ts` - Accept EQ data, track time
- `backend/src/handlers/refine.ts` - Track refinement history
- `backend/src/handlers/auth.ts` - Enhanced account generation

**New Endpoints:**
- `GET /api/admin/metrics` - Admin dashboard metrics
- `GET /api/admin/time-saved` - Time saved statistics
- `GET /api/admin/users` - User management
- `POST /api/user-profiles` - Create/update user profile
- `GET /api/user-profiles/:id` - Get user profile
- `GET /api/drafts/:id/history` - Refinement history
- `GET /api/drafts/:id/metrics` - Letter metrics
- `POST /api/user-relationships` - Create primary/secondary relationship
- `GET /api/user-relationships` - List relationships

### Phase 3.4: Frontend Components

**New Pages:**
- `frontend/src/pages/AdminDashboard.tsx` - Admin metrics dashboard
- `frontend/src/pages/UserProfile.tsx` - User profile management
- `frontend/src/pages/UserManagement.tsx` - Primary/secondary user management

**New Components:**
- `frontend/src/components/MetricsMeters.tsx` - All 8 tone/content/structure meters
- `frontend/src/components/RefinementHistory.tsx` - Show refinement history
- `frontend/src/components/TimeSavedWidget.tsx` - Display time saved
- `frontend/src/components/EQDataForm.tsx` - Collect human data for EQ (user + case)
- `frontend/src/components/AdminMetrics.tsx` - Admin dashboard widgets

**Enhanced Components:**
- `frontend/src/components/LetterEditor.tsx` - Add metrics meters with real-time updates
- `frontend/src/components/DocumentUpload.tsx` - Collect case context
- `frontend/src/pages/Login.tsx` - Enhanced account generation flow

### Phase 3.5: Docker Infrastructure & Deployment

**Docker Configuration:**
- Create `backend/Dockerfile` - Node.js/Express container
- Create `frontend/Dockerfile` - React build with Nginx
- Update `docker-compose.yml` - Full stack orchestration
- Create `.dockerignore` files - Avoid path length issues
- Create `docker-compose.prod.yml` - Production configuration

**Deployment Options:**
- **Option A:** Docker Compose on VPS/EC2 instance (simplest)
- **Option B:** Docker containers on AWS ECS/Fargate (scalable)
- **Option C:** Docker Swarm cluster (multi-host)
- **Option D:** Kubernetes (if enterprise scaling needed)

**Infrastructure Files:**
- `docker-compose.yml` - Local development
- `docker-compose.prod.yml` - Production deployment
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `.dockerignore` files
- `deploy-docker.sh` / `deploy-docker.ps1` - Docker deployment scripts

**Monitoring & Logging:**
- Container health checks
- Log aggregation
- Performance monitoring
- Error tracking

## Technical Details

### Database Schema Additions

**user_profiles table:**
- user_id (FK), communication_style, preferred_tone, formality_level, urgency_tendency, empathy_preference, notes

**refinement_history table:**
- id, draft_letter_id, user_id, prompt_text, response_text, version, metrics_before (JSON), metrics_after (JSON), created_at

**letter_metrics table:**
- id, draft_letter_id, intensity (1-10), seriousness (1-10), formality (1-10), clarity (1-10), persuasiveness (1-10), empathy (1-10), structure_quality (1-10), legal_precision (1-10), calculated_at

**time_tracking table:**
- id, user_id, draft_letter_id, action_type, start_time, end_time, estimated_manual_time, user_reported_time, time_saved, created_at

**user_relationships table:**
- id, primary_user_id, secondary_user_id, created_at, status (active/inactive)

**case_context table (new):**
- id, draft_letter_id, user_id, relationship_dynamics, urgency_level, previous_interactions, case_sensitivity, target_recipient_role, target_recipient_org, target_relationship, created_at

### AI Enhancement

**EQ Data Integration:**
- Include user profile data in AI generation prompts
- Use case-specific context to adjust tone and content
- Apply historical preferences to new letters
- Combine user profile + case context for optimal letter generation

**Metrics Calculation:**
- Use NLP analysis (OpenRouter API or local NLP library) to calculate all 8 metrics
- Compare metrics before/after refinement
- Provide real-time feedback during editing
- Use industry-standard NLP techniques for legal document analysis

### Time Saved Calculation (Combined Automated + User Input)

**Automated Tracking:**
- Document upload start → completion
- Letter generation start → completion
- Refinement iterations (each refinement tracked separately)
- Export completion
- Total automated time = sum of all tracked intervals

**User Input:**
- User can optionally report estimated manual time per letter
- User can adjust baseline estimates
- System learns from user feedback over time

**Calculation:**
- Baseline: User-provided estimate OR default (2-4 hours per letter)
- Actual: Automated tracking + user-reported time for manual edits
- Saved: Baseline - Actual
- Aggregate: Total time saved across all users/letters
- Display: Per-user, per-letter, and system-wide metrics

## Deployment Strategy

### Docker-Based Deployment (Selected)

**Architecture:**
- **Frontend:** Docker container with Nginx serving React build
- **Backend:** Docker container with Node.js/Express
- **Database:** PostgreSQL in Docker or managed service (RDS)
- **Storage:** S3 (existing) or local volume for development
- **Orchestration:** Docker Compose for local/staging, Docker Swarm or ECS for production

**Benefits:**
- Avoids Windows path length issues
- Consistent environments across dev/staging/prod
- Easier local development
- Simplified deployment process
- Better resource management

**Docker Setup:**
1. Create Dockerfiles for backend and frontend
2. Update docker-compose.yml for full stack
3. Add .dockerignore files to avoid path issues
4. Create production docker-compose.prod.yml
5. Set up environment variable management
6. Configure volume mounts for persistent data
7. Set up health checks and restart policies

**Deployment Steps:**
1. Build Docker images
2. Push to container registry (optional)
3. Deploy using docker-compose or orchestration tool
4. Run database migrations
5. Verify health checks
6. Monitor logs and performance

## Success Criteria

1. ✅ Admin dashboard displays time saved metrics (automated + user input)
2. ✅ User profiles collect EQ data (user profile + case-specific)
3. ✅ Refinement history tracked for all AI prompts
4. ✅ All 8 tone/content/structure meters functional with real-time updates
5. ✅ Primary/secondary user relationships working
6. ✅ System deployed and accessible using Docker
7. ✅ All Phase 3 features integrated with existing MVP
8. ✅ Docker deployment avoids path length issues
9. ✅ Metrics calculated using best practices NLP techniques

## Risk Mitigation

- Database migrations tested in staging
- Feature flags for gradual rollout
- Backup and rollback procedures
- Performance testing for new metrics calculations
- Security review for admin endpoints
- Docker image size optimization
- Path length testing on Windows
- Container resource limits

## Timeline Estimate

- Phase 3.1 (Database): 1-2 days
- Phase 3.2 (Backend): 3-4 days
- Phase 3.3 (API): 2-3 days
- Phase 3.4 (Frontend): 4-5 days
- Phase 3.5 (Docker Deployment): 2-3 days
- **Total:** 12-17 days

## Next Steps

1. ✅ Answer clarifying questions (completed)
2. Finalize database schema design with all fields
3. Begin implementation with database migrations
4. Iterate through backend, API, and frontend
5. Set up Docker infrastructure
6. Deploy to staging environment
7. Test and refine
8. Deploy to production

## Additional Clarifying Questions

Before finalizing, please confirm:

1. **Docker Deployment Target:**
   - a) Local development only (Docker Compose)
   - b) VPS/EC2 with Docker Compose
   - c) AWS ECS/Fargate
   - d) Other (specify)

2. **Primary/Secondary User Permissions:**
   - What specific permissions should secondary users have? (e.g., can they create drafts, edit, export, or only view?)

3. **Admin Dashboard Visualizations:**
   - What specific charts/graphs do you want? (e.g., time saved over time, user activity heatmap, letter generation trends)

4. **Metrics Calculation Method:**
   - Should we use OpenRouter API for NLP analysis, or integrate a dedicated NLP library (e.g., Natural, Compromise)?

5. **Database in Docker:**
   - Should PostgreSQL run in Docker for production, or use managed RDS?

