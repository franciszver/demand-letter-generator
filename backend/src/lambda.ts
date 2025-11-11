import serverless from 'serverless-http';
import app from './index';

// Export the Express app wrapped for Lambda
// Configure binary media types for file uploads
export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
});

