# Infrastructure Setup

This directory contains AWS infrastructure as code using AWS SAM.

## Prerequisites

- AWS CLI configured with profile "default"
- AWS SAM CLI installed
- Node.js 18+ for building Lambda functions

## Deployment

### Build

```bash
sam build
```

### Deploy

```bash
sam deploy --guided
```

You'll be prompted for:
- Stack name
- AWS Region
- OpenRouter API Key
- Database connection details
- JWT Secret
- CORS Origin

### Environment Variables

The template uses the following parameters:
- `Environment`: dev, staging, or prod
- `OpenRouterApiKey`: Your OpenRouter API key
- Database credentials (via Secrets Manager or parameters)
- `JwtSecret`: Secret for JWT token signing
- `CorsOrigin`: Allowed CORS origin (e.g., https://yourdomain.com)

## Resources Created

- 3 S3 buckets (documents, processed, exports)
- IAM roles and policies
- Secrets Manager secret for API keys
- API Gateway REST API
- Lambda functions for all endpoints

## Local Testing

For local development, use the Express server directly. Lambda functions are designed to work with `serverless-http` wrapper for compatibility.

