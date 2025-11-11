import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { CollaborationService } from './services/collaboration';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, uploadLimiter, aiLimiter } from './middleware/rateLimit';
import { authenticate, AuthRequest } from './middleware/auth';
import { auditLog } from './middleware/auditLog';
import { uploadHandler } from './handlers/upload';
import { generateHandler } from './handlers/generate';
import { refineHandler } from './handlers/refine';
import {
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
} from './handlers/templates';
import { exportHandler } from './handlers/export';
import { registerHandler, loginHandler } from './handlers/auth';
import { getDraftHandler, listDraftsHandler, updateDraftHandler } from './handlers/drafts';
import { getDocumentHandler } from './handlers/documents';
import { createOrUpdateUserProfileHandler, getUserProfileHandler } from './handlers/user-profiles';
import { getMetricsHandler, getTimeSavedHandler, getUsersHandler, requireAdmin } from './handlers/admin';
import { getDraftMetricsHandler, calculateMetricsHandler } from './handlers/metrics';
import { createRelationshipHandler, listRelationshipsHandler, deactivateRelationshipHandler } from './handlers/user-relationships';
import { getRefinementHistoryHandler } from './handlers/draft-versions';
import { getDraftActivityHandler } from './handlers/activity';

dotenv.config();

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables before starting the application.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize collaboration service only if not in Lambda
// Lambda doesn't support persistent WebSocket connections
let collaborationService: CollaborationService | null = null;
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  collaborationService = new CollaborationService(httpServer);
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);
app.use(auditLog);

// Health check
app.get('/health', async (req, res) => {
  const basicHealth = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // If detailed query param is provided, include resource status
  if (req.query.detailed === 'true') {
    try {
      const { checkResourceHealth } = await import('./utils/verify-resources');
      const health = await checkResourceHealth();
      res.json({
        ...basicHealth,
        resources: health.details,
        healthy: health.healthy,
      });
    } catch (error) {
      res.json({
        ...basicHealth,
        resources: { error: 'Resource check failed' },
      });
    }
  } else {
    res.json(basicHealth);
  }
});

// Auth routes (no authentication required)
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);

// API Routes
// Upload endpoint
app.post('/api/upload', authenticate, uploadLimiter, uploadHandler);

// Generate endpoint
app.post('/api/generate', authenticate, aiLimiter, generateHandler);

// Refine endpoint
app.post('/api/refine', authenticate, aiLimiter, refineHandler);

// Templates endpoints
app.get('/api/templates', authenticate, listTemplatesHandler);
app.post('/api/templates', authenticate, createTemplateHandler);
app.put('/api/templates/:id', authenticate, updateTemplateHandler);
app.delete('/api/templates/:id', authenticate, deleteTemplateHandler);

// Export endpoint
app.post('/api/export', authenticate, exportHandler);

// Drafts endpoints
app.get('/api/drafts', authenticate, listDraftsHandler);
app.get('/api/drafts/:id', authenticate, getDraftHandler);
app.patch('/api/drafts/:id', authenticate, updateDraftHandler);

// Documents endpoint
app.get('/api/documents/:id', authenticate, getDocumentHandler);

// Phase 3: User Profiles
app.post('/api/user-profiles', authenticate, createOrUpdateUserProfileHandler);
app.get('/api/user-profiles/:id?', authenticate, getUserProfileHandler);

// Phase 3: Admin endpoints
app.get('/api/admin/metrics', authenticate, requireAdmin, getMetricsHandler);
app.get('/api/admin/time-saved', authenticate, requireAdmin, getTimeSavedHandler);
app.get('/api/admin/users', authenticate, requireAdmin, getUsersHandler);

// Phase 3: Metrics endpoints
app.get('/api/drafts/:id/metrics', authenticate, getDraftMetricsHandler);
app.post('/api/metrics/calculate', authenticate, calculateMetricsHandler);

// Phase 3: Refinement history
app.get('/api/drafts/:id/history', authenticate, getRefinementHistoryHandler);

// Phase 3: Draft activity (polling-based collaboration)
app.get('/api/drafts/:id/activity', authenticate, getDraftActivityHandler);

// Phase 3: User relationships
app.post('/api/user-relationships', authenticate, createRelationshipHandler);
app.get('/api/user-relationships', authenticate, listRelationshipsHandler);
app.post('/api/user-relationships/deactivate', authenticate, deactivateRelationshipHandler);

// Error handling
app.use(errorHandler);

// Start server (for local development)
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Lambda
export default app;

