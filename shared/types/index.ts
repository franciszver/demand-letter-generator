// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'attorney' | 'paralegal';
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  extractedText?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DraftLetter {
  id: string;
  userId: string;
  documentId?: string;
  templateId?: string;
  title: string;
  content: string;
  s3Key: string;
  version: number;
  status: 'draft' | 'generated' | 'refined' | 'final';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  draftLetterId: string;
  userId: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  documentId: string;
  status: string;
  message: string;
}

export interface GenerateRequest {
  documentId: string;
  templateId?: string;
}

export interface RefineRequest {
  draftId: string;
  instructions: string;
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

