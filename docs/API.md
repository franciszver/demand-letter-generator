# API Documentation

## Base URL

- Local: `http://localhost:3001/api`
- Production: `https://your-api-gateway-url.com/api`

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "attorney" // optional: "admin", "attorney", "paralegal"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Documents

#### Upload Document
```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "status": "processing",
    "message": "File uploaded successfully. Processing in background."
  }
}
```

#### Get Document
```http
GET /documents/:id
Authorization: Bearer <token>
```

### Draft Letters

#### Generate Letter
```http
POST /generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "uuid",
  "templateId": "uuid" // optional
}
```

#### Refine Letter
```http
POST /refine
Authorization: Bearer <token>
Content-Type: application/json

{
  "draftId": "uuid",
  "instructions": "Make the tone more formal"
}
```

#### Get Draft
```http
GET /drafts/:id
Authorization: Bearer <token>
```

#### List Drafts
```http
GET /drafts
Authorization: Bearer <token>
```

### Templates

#### List Templates
```http
GET /templates
Authorization: Bearer <token>
```

#### Create Template
```http
POST /templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Standard Demand Letter",
  "content": "Dear {{client_name}},\n\n...",
  "variables": ["client_name", "date"] // optional, auto-extracted
}
```

#### Update Template
```http
PUT /templates/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "content": "Updated content..."
}
```

#### Delete Template
```http
DELETE /templates/:id
Authorization: Bearer <token>
```

### Export

#### Export to Word
```http
POST /export
Authorization: Bearer <token>
Content-Type: application/json

{
  "draftId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3-presigned-url",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

