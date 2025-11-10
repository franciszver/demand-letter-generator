# Demand Letter Generator

AI-powered web application for generating legal demand letters. Upload source documents (PDF, DOCX, images), use AI to analyze content and generate draft letters, support firm-specific templates, enable AI refinement based on attorney instructions, and export to Word format.

**Organization:** Steno  
**Status:** Production Ready - Core Features Complete

## Tech Stack

- **Frontend:** React (TypeScript) with Vite, Tailwind CSS
- **Backend:** Node.js/Express (TypeScript) with serverless-http
- **Database:** PostgreSQL
- **Storage:** AWS S3
- **AI:** OpenRouter API (GPT-4o)
- **Deployment:** AWS Lambda, S3/CloudFront

## Project Structure

```
demand-letter-generator/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── infrastructure/    # AWS infrastructure as code
├── shared/            # Shared types and utilities
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- AWS CLI configured with profile "default"
- OpenRouter API key
- Docker (for local PostgreSQL)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demand-letter-generator
   ```

2. **Set up PostgreSQL**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration:
   # - Database credentials
   # - OpenRouter API key
   # - AWS credentials (for S3)
   npm run migrate
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env if needed (defaults work for local dev)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Environment Variables

### Backend (.env)
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret for JWT tokens
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `AWS_REGION` - AWS region
- `AWS_PROFILE` - AWS profile name (default: default)
- `S3_BUCKET_DOCUMENTS` - S3 bucket for documents
- `S3_BUCKET_PROCESSED` - S3 bucket for processed files
- `S3_BUCKET_EXPORTS` - S3 bucket for exports
- `CORS_ORIGIN` - Allowed CORS origin

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:3001)

## Features

### Core Functionality (P0 - Must Have)

- ✅ **Document Upload & Processing**
  - Support for PDF, DOCX, JPEG, PNG, GIF, WEBP formats
  - Automatic text extraction from documents
  - Image OCR using AI vision capabilities
  - Secure storage in AWS S3

- ✅ **AI-Powered Letter Generation**
  - Automatic analysis of uploaded documents
  - Intelligent demand letter generation using GPT-4o
  - Context-aware content creation
  - Template-based formatting support

- ✅ **Template Management**
  - Create, edit, and manage firm-specific templates
  - Variable substitution system (`{{variable_name}}`)
  - Automatic variable detection and replacement
  - Firm-level template storage

- ✅ **AI Refinement**
  - Natural language instruction processing
  - Iterative letter refinement
  - Context-aware content improvement
  - Version tracking for revisions

- ✅ **Word Document Export**
  - Professional Word document generation
  - Proper formatting and styling
  - Secure download links with expiration
  - One-click export functionality

### Advanced Features (P1 - Should Have)

- ✅ **Real-Time Collaboration**
  - Multi-user simultaneous editing
  - Live user presence tracking
  - Real-time content synchronization
  - WebSocket-based communication
  - Change tracking and version history

### Security & Infrastructure

- ✅ **Authentication & Authorization**
  - JWT-based secure authentication
  - Role-based access control (Attorney, Paralegal, Admin)
  - Secure password hashing
  - Session management

- ✅ **Security Features**
  - Rate limiting (API, upload, AI operations)
  - CORS protection
  - Input validation and sanitization
  - Secure credential management
  - Audit logging for all operations

- ✅ **Deployment & Infrastructure**
  - AWS Lambda serverless architecture
  - Auto-scaling capabilities
  - Infrastructure as Code (AWS SAM)
  - Automated deployment scripts
  - CloudWatch monitoring and logging

### User Experience

- ✅ **Intuitive Interface**
  - Modern React UI with Tailwind CSS
  - Drag-and-drop file upload
  - Real-time feedback and notifications
  - Responsive design
  - Error handling and user-friendly messages

## What We've Accomplished

This project successfully implements a complete AI-powered demand letter generation system with the following achievements:

### ✅ Complete Implementation of Core Requirements
- All P0 (Must-Have) requirements from the PRD are fully implemented
- All user stories are complete and functional
- Real-time collaboration feature (P1) is fully operational

### ✅ Production-Ready Infrastructure
- Serverless architecture deployed on AWS
- Scalable and cost-effective solution
- Comprehensive error handling and logging
- Security best practices implemented

### ✅ Developer Experience
- TypeScript throughout for type safety
- Shared types between frontend and backend
- Comprehensive documentation
- Easy local development setup
- Automated deployment processes

### ✅ User Experience
- Intuitive and modern interface
- Real-time collaboration capabilities
- Professional document output
- Seamless workflow from upload to export

**See [achieved.md](achieved.md) for a detailed breakdown of implemented features versus PRD requirements.**

## Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [User Guide](docs/USER_GUIDE.md) - End-user documentation
- [Template Creation Guide](docs/TEMPLATE_GUIDE.md) - Template system guide
- [Deployment Guide](docs/DEPLOYMENT.md) - AWS deployment instructions
- [AWS Credentials Setup](docs/AWS_CREDENTIALS_SETUP.md) - AWS configuration
- [Local S3 Setup](docs/LOCAL_S3_SETUP.md) - S3 setup for development
- [Achievement Summary](achieved.md) - Feature completion status

## Project Structure

```
demand-letter-generator/
├── frontend/          # React frontend (Vite + TypeScript)
├── backend/           # Express backend (Node.js + TypeScript)
├── infrastructure/    # AWS SAM templates
├── shared/            # Shared TypeScript types
├── docs/              # Documentation
└── docker-compose.yml # Local PostgreSQL setup
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Quick Start

### For Users
1. Register an account
2. Upload source documents (PDF, DOCX, or images)
3. Generate a demand letter using AI
4. Refine the letter with natural language instructions
5. Export to Word format

### For Developers
See the [Getting Started](#getting-started) section above for local development setup.

### For Deployment
See the [Deployment Guide](docs/DEPLOYMENT.md) for AWS deployment instructions.

## Project Status

**Overall Completion:** ~90%

- **P0 Requirements:** 100% ✅
- **P1 Requirements:** 75% ⚠️ (Customizable AI prompts pending)
- **P2 Requirements:** 0% ❌ (Third-party integrations - future work)

The application is **production-ready** for core use cases. See [achieved.md](achieved.md) for detailed status.

## Contributing

This is a proprietary project for Steno. For questions or contributions, please contact the project maintainers.

## License

Proprietary - Steno

