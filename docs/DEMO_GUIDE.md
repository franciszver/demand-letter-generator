# Demo Guide - Steno Draft

**Purpose:** This guide helps you prepare and execute a successful demo of Steno Draft to potential clients (e.g., Steno.com).

## Pre-Demo Setup

### 1. Seed Demo Data

Before the demo, populate the system with realistic data:

```bash
# Navigate to backend directory
cd backend

# Run database migrations (if not already done)
npm run migrate

# Seed demo users, templates, and drafts
npm run seed:demo

# Generate analytics history (90 days)
npm run seed:analytics
```

**Demo Users Created:**
- `admin@stenodraft.com` / `demo123` (Admin)
- `attorney1@stenodraft.com` / `demo123` (Attorney)
- `attorney2@stenodraft.com` / `demo123` (Attorney)
- `paralegal1@stenodraft.com` / `demo123` (Paralegal)
- `paralegal2@stenodraft.com` / `demo123` (Paralegal)

### 2. Verify System Status

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Verify admin dashboard is accessible at `/admin`
4. Check analytics dashboard shows data

### 3. Prepare Demo Script

Have a clear narrative ready:
- **Problem:** Manual demand letter creation is time-consuming
- **Solution:** AI-powered automation with Steno Draft
- **Benefits:** Time savings, consistency, ROI

## Demo Flow (30-45 minutes)

### Part 1: User Experience (15 minutes)

#### 1.1 Login & Overview (2 min)
- Login as `attorney1@stenodraft.com`
- Show home dashboard
- Highlight recent drafts and templates

#### 1.2 Document Upload (3 min)
- Upload a sample case document (PDF/Word)
- Show processing status
- Explain AI document analysis

#### 1.3 Letter Generation (5 min)
- Select template (optional)
- Generate demand letter
- Show AI-generated content
- Highlight professional tone and structure

#### 1.4 Letter Refinement (3 min)
- Use AI refinement feature
- Example: "Make the tone more assertive"
- Show real-time collaboration (if multiple users)

#### 1.5 Export & Completion (2 min)
- Export to Word document
- Show professional formatting
- Highlight time saved vs. manual process

### Part 2: Admin Features (15 minutes)

#### 2.1 Admin Dashboard (2 min)
- Login as `admin@stenodraft.com`
- Show overview dashboard
- Highlight key metrics

#### 2.2 Analytics Dashboard (5 min)
- Show usage statistics
- Display ROI calculations
- Review time savings metrics
- Explain business value

#### 2.3 Content Management (3 min)
- View all templates
- Review letter drafts across users
- Show content organization

#### 2.4 User Management (2 min)
- Create/edit users
- Manage roles (attorney, paralegal, admin)
- Show access control

#### 2.5 System Health (2 min)
- Monitor system status
- Check database performance
- Review active sessions

#### 2.6 Advanced Features (1 min)
- Webhook configuration
- AI prompt customization
- Integration capabilities

### Part 3: Enterprise Features (10 minutes)

#### 3.1 Customizable AI Prompts (3 min)
- Show prompt management
- Explain customization options
- Demonstrate firm-specific prompts

#### 3.2 Version History (2 min)
- Show version tracking
- Demonstrate rollback capability
- Highlight audit trail

#### 3.3 Webhooks & Integrations (3 min)
- Configure webhook
- Test webhook delivery
- Explain integration possibilities

#### 3.4 Compliance & Privacy (2 min)
- Show privacy policy
- Demonstrate data export (GDPR)
- Explain data retention

## Key Talking Points

### Value Proposition
- **Time Savings:** 2-4 hours per letter → 5-10 minutes
- **ROI:** $250/hour attorney rate × 3 hours saved = $750 per letter
- **Consistency:** Firm-wide templates ensure uniform quality
- **Scalability:** Handle more cases without proportional time increase

### Technical Highlights
- **AI-Powered:** GPT-4o for intelligent document analysis
- **Real-time Collaboration:** Multiple attorneys can work simultaneously
- **Enterprise-Ready:** Admin dashboard, analytics, user management
- **Secure:** AWS S3 storage, encrypted data, role-based access
- **Integration-Ready:** Webhooks, API access, SSO-ready architecture

### Demo Metrics to Highlight
- Letters generated: Show analytics dashboard
- Time saved: Calculate from usage stats
- Active users: Demonstrate team collaboration
- System uptime: Show reliability

## Troubleshooting During Demo

### If Something Breaks
1. **Stay Calm:** Have backup demo data ready
2. **Quick Fix:** Restart services if needed
3. **Pivot:** Focus on features that are working
4. **Honesty:** Acknowledge it's a demo environment

### Common Issues
- **Slow AI Response:** Explain it's using real AI (not cached)
- **Missing Data:** Use seed scripts to regenerate
- **Connection Issues:** Have local backup ready

## Post-Demo

### Follow-Up Materials
1. **Demo Recording:** If recorded, share highlights
2. **Feature List:** Provide comprehensive feature documentation
3. **Pricing Discussion:** Be ready for pricing questions
4. **Next Steps:** Schedule follow-up meeting

### Questions to Anticipate
- **Pricing:** Be prepared with pricing model
- **Customization:** Explain prompt/template customization
- **Integration:** Detail webhook/API capabilities
- **Security:** Address data security and compliance
- **Support:** Explain support and training options

## Quick Reference

### Demo Accounts
- Admin: `admin@stenodraft.com` / `demo123`
- Attorney: `attorney1@stenodraft.com` / `demo123`
- Paralegal: `paralegal1@stenodraft.com` / `demo123`

### Key URLs (Local)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Admin Dashboard: `http://localhost:5173/admin`
- Analytics: `http://localhost:5173/admin/analytics`

### Demo Script Commands
```bash
# Reset demo data
cd backend
npm run seed:demo
npm run seed:analytics

# Check system health
curl http://localhost:3001/health
```

## Tips for Success

1. **Practice First:** Run through the demo at least once before the actual presentation
2. **Have Backup:** Keep demo data scripts ready to regenerate data
3. **Focus on Value:** Emphasize time savings and ROI, not just features
4. **Be Interactive:** Ask questions, show how it solves their pain points
5. **Address Concerns:** Be ready to discuss security, compliance, and integration
6. **End Strong:** Summarize key benefits and next steps

## Demo Checklist

- [ ] Demo data seeded
- [ ] All services running
- [ ] Sample documents ready
- [ ] Demo accounts tested
- [ ] Analytics data populated
- [ ] Admin features verified
- [ ] Backup plan ready
- [ ] Talking points prepared
- [ ] Questions anticipated
- [ ] Follow-up materials ready

---

**Good luck with your demo!** Remember: Focus on solving their problems, not just showing features.

