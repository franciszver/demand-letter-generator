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
import { requireAdmin } from './middleware/adminAuth';
import { getContentHandler } from './handlers/admin/content';
import { getAnalyticsHandler } from './handlers/admin/analytics';
import { getHealthHandler } from './handlers/admin/health';
import { getUsersHandler, createUserHandler, updateUserHandler, deleteUserHandler } from './handlers/admin/users';
import { listWebhooksHandler, createWebhookHandler, updateWebhookHandler, deleteWebhookHandler, testWebhookHandler } from './handlers/webhooks';
import { listPromptsHandler, getPromptHandler, createPromptHandler, updatePromptHandler, deletePromptHandler } from './handlers/prompts';
import { listVersionsHandler, getVersionHandler, createVersionHandler } from './handlers/draft-versions';
import { exportUserDataHandler } from './handlers/user-data';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize collaboration service
const collaborationService = new CollaborationService(httpServer);

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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Admin endpoints
app.get('/api/admin/content', authenticate, requireAdmin, getContentHandler);
app.get('/api/admin/analytics', authenticate, requireAdmin, getAnalyticsHandler);
app.get('/api/admin/health', authenticate, requireAdmin, getHealthHandler);
app.get('/api/admin/users', authenticate, requireAdmin, getUsersHandler);
app.post('/api/admin/users', authenticate, requireAdmin, createUserHandler);
app.put('/api/admin/users/:id', authenticate, requireAdmin, updateUserHandler);
app.delete('/api/admin/users/:id', authenticate, requireAdmin, deleteUserHandler);

// Webhooks endpoints
app.get('/api/webhooks', authenticate, listWebhooksHandler);
app.post('/api/webhooks', authenticate, createWebhookHandler);
app.put('/api/webhooks/:id', authenticate, updateWebhookHandler);
app.delete('/api/webhooks/:id', authenticate, deleteWebhookHandler);
app.post('/api/webhooks/:id/test', authenticate, testWebhookHandler);

// Prompts endpoints
app.get('/api/prompts', authenticate, listPromptsHandler);
app.get('/api/prompts/:id', authenticate, getPromptHandler);
app.post('/api/prompts', authenticate, createPromptHandler);
app.put('/api/prompts/:id', authenticate, updatePromptHandler);
app.delete('/api/prompts/:id', authenticate, deletePromptHandler);

// Draft versions endpoints
app.get('/api/drafts/:draftId/versions', authenticate, listVersionsHandler);
app.get('/api/drafts/:draftId/versions/:versionNumber', authenticate, getVersionHandler);
app.post('/api/drafts/:draftId/versions', authenticate, createVersionHandler);

// User data export (GDPR)
app.get('/api/user/data-export', authenticate, exportUserDataHandler);

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

