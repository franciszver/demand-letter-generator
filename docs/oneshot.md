---

### 4. Steno - Demand Letter Generator

```
# PROJECT: Demand Letter Generator - AI-Powered Legal Document Creation

## GIT REPOSITORY

**Repository Name:** `demand-letter-generator`

**Repository Description:** AI-powered web application for generating legal demand letters. Uploads source documents (PDF, DOCX, images), uses OpenAI to analyze content and generate draft letters, supports firm-specific templates, enables AI refinement based on attorney instructions, and exports to Word format. Built with React frontend and AWS Lambda backend.

## PHASE 1: INITIAL CREDENTIALS COLLECTION (HUMAN INTERACTION REQUIRED)

Collect from human:

1. **AWS Credentials:**
   - AWS Access Key ID
   - AWS Secret Access Key
   - Preferred AWS Region
   - S3 bucket name for document storage

2. **OpenAI/OpenRouter:**
   - OpenAI API Key (or OpenRouter API Key)
   - Preferred model (default: gpt-4o)

3. **Project Configuration:**
   - Project name
   - Domain name (if custom)
   - Maximum file upload size
   - Supported document formats

4. **Optional:**
   - Sample demand letter templates
   - Firm-specific requirements

Once collected, proceed AUTONOMOUSLY.

## PHASE 2: AUTONOMOUS IMPLEMENTATION

### Project Overview
Build a web application for generating legal demand letters:
- Upload source documents (PDF, DOCX, images)
- AI analyzes documents and generates draft demand letter
- Firm-specific template management
- AI refinement based on attorney instructions
- Export to Word document format
- Real-time collaboration (P1 feature)

### Technical Stack
- **Frontend:** React (TypeScript)
- **Backend:** Node.js/Express or Python/FastAPI
- **Storage:** AWS S3 (documents), DynamoDB (templates, sessions)
- **AI:** OpenAI API (document analysis, generation)
- **Compute:** AWS Lambda + API Gateway
- **Deployment:** AWS SAM/Serverless

### Implementation Steps

#### Step 1: Project Structure
```
demand-letter-generator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── LetterEditor.tsx
│   │   │   ├── TemplateManager.tsx
│   │   │   └── ExportButton.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Editor.tsx
│   │   └── services/
│   │       └── api.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── upload.ts
│   │   │   ├── generate.ts
│   │   │   ├── refine.ts
│   │   │   ├── templates.ts
│   │   │   └── export.ts
│   │   ├── services/
│   │   │   ├── document-processor.ts
│   │   │   ├── ai-generator.ts
│   │   │   └── word-exporter.ts
│   │   └── models/
│   └── package.json
├── infrastructure/
└── README.md
```

#### Step 2: Backend Services

**Document Processor (document-processor.ts)**
- Accept file uploads (PDF, DOCX, images)
- Extract text using libraries (pdf-parse, mammoth, tesseract.js)
- Use OpenAI Vision API for image OCR
- Store processed text in S3
- Return document ID and extracted content

**AI Generator (ai-generator.ts)**
- Accept extracted document content
- Use OpenAI to analyze legal context
- Generate demand letter draft
- Apply firm template if specified
- Return draft with citations/references

**AI Refiner (refine.ts)**
- Accept draft letter and refinement instructions
- Use OpenAI to refine based on instructions
- Maintain legal accuracy
- Return refined draft

**Word Exporter (word-exporter.ts)**
- Convert draft to Word document (.docx)
- Use docx library
- Apply formatting
- Return downloadable file

**Template Manager (templates.ts)**
- CRUD operations for firm templates
- Store in DynamoDB
- Template variables/placeholders
- Template versioning

#### Step 3: Frontend Components

**DocumentUpload Component:**
- Drag-and-drop file upload
- File type validation
- Progress indicator
- Preview uploaded documents

**LetterEditor Component:**
- Rich text editor (Draft.js or similar)
- AI refinement input
- Real-time preview
- Change tracking (P1)

**TemplateManager Component:**
- List firm templates
- Create/edit templates
- Template variables
- Apply template to draft

**ExportButton Component:**
- Export to Word
- Download file
- Progress indicator

#### Step 4: API Endpoints

**POST /api/upload**
- Accept multipart/form-data
- Validate file type and size
- Process document
- Return document ID

**POST /api/generate**
- Accept document ID and template ID (optional)
- Generate draft letter
- Return draft content

**POST /api/refine**
- Accept draft ID and instructions
- Refine letter
- Return refined draft

**GET /api/templates**
- List all templates
- Return template list

**POST /api/templates**
- Create new template
- Store in DynamoDB

**POST /api/export**
- Accept draft content
- Generate Word document
- Return download URL

#### Step 5: AI Prompt Engineering

**Document Analysis Prompt:**
```
Analyze the following legal documents and extract:
1. Key facts and events
2. Parties involved
3. Damages or claims
4. Relevant dates
5. Legal basis for demand

Documents: [extracted content]
```

**Letter Generation Prompt:**
```
Generate a professional demand letter based on the following information:
[Document analysis]

Template structure: [firm template]
Tone: Professional and firm
Include: All relevant facts, legal basis, specific demands, deadline
```

**Refinement Prompt:**
```
Refine the following demand letter based on these instructions:
[Instructions]

Maintain legal accuracy and professional tone.
Current draft: [draft content]
```

#### Step 6: AWS Infrastructure

**S3 Buckets:**
- documents/ - Uploaded source documents
- processed/ - Extracted text
- exports/ - Generated Word documents

**DynamoDB Tables:**
- templates - Firm templates
- sessions - Draft sessions (for collaboration)

**Lambda Functions:**
- upload-handler
- generate-handler
- refine-handler
- templates-handler
- export-handler

**API Gateway:**
- REST API with CORS
- File upload support
- Authentication (API keys or Cognito)

#### Step 7: Testing

1. Test document upload (all formats)
2. Test text extraction accuracy
3. Test AI generation quality
4. Test refinement functionality
5. Test Word export
6. Test template management
7. End-to-end workflow test

#### Step 8: Deployment

1. Deploy backend infrastructure
2. Deploy frontend to S3/CloudFront
3. Configure API Gateway
4. Set up environment variables
5. Test deployed application
6. Generate deployment summary

### Deliverables

1. **Working Application:**
   - Frontend URL
   - API endpoints
   - All features functional

2. **Documentation:**
   - User guide
   - API documentation
   - Template creation guide
   - Deployment guide

3. **Code Repository:**
   - Complete source code
   - Infrastructure as code
   - README

### Success Criteria

- ✅ Upload and process documents (PDF, DOCX, images)
- ✅ Generate accurate demand letter drafts
- ✅ Refine letters based on instructions
- ✅ Export to Word format
- ✅ Manage firm templates
- ✅ Handle errors gracefully
- ✅ Secure document storage

### Notes

- Use AWS Secrets Manager for API keys
- Implement file size limits
- Add virus scanning for uploads (optional)
- Use presigned URLs for S3 access
- Implement rate limiting
- Add audit logging for legal compliance
```
