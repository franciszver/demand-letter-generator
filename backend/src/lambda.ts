import serverless from 'serverless-http';
import app from './index';

// Export the Express app wrapped for Lambda
export const handler = serverless(app);

