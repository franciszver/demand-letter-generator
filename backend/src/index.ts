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
import { getDraftHandler, listDraftsHandler } from './handlers/drafts';
import { getDocumentHandler } from './handlers/documents';

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

// Documents endpoint
app.get('/api/documents/:id', authenticate, getDocumentHandler);

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

