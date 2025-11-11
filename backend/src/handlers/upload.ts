import { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { DocumentModel } from '../models/Document';
import { DocumentProcessor } from '../services/document-processor';
import { uploadToS3 } from '../config/s3';

const DOCUMENTS_BUCKET = process.env.S3_BUCKET_DOCUMENTS || 'demand-letter-generator-dev-documents';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
}).single('file');

export const uploadHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    try {
      const userId = req.user!.id;
      const file = req.file;
      const fileId = uuidv4();
      const s3Key = `documents/${userId}/${fileId}-${file.originalname}`;

      // Upload file to S3
      await uploadToS3(DOCUMENTS_BUCKET, s3Key, file.buffer, file.mimetype);

      // Create document record
      const document = await DocumentModel.create({
        userId,
        filename: fileId,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        s3Key,
        status: 'processing',
      });

      // Process document asynchronously
      DocumentProcessor.processDocument(file.buffer, file.mimetype, s3Key)
        .then(async (processed) => {
          await DocumentModel.update(document.id, {
            extractedText: processed.text.substring(0, 1000), // Store summary
            status: 'completed',
          });
        })
        .catch(async (error) => {
          console.error('Document processing error:', error);
          await DocumentModel.update(document.id, {
            status: 'failed',
          });
        });

      res.json({
        success: true,
        data: {
          documentId: document.id,
          status: document.status,
          message: 'File uploaded successfully. Processing in background.',
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Error details:', { errorMessage, errorStack });
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Upload failed',
        ...(process.env.NODE_ENV === 'development' && { details: errorStack }),
      });
    }
  });
};

// Lambda handler wrapper
export const handler = async (event: any, context: any) => {
  // This would be wrapped by serverless-http in actual Lambda
  // For now, this is the Express handler
  return uploadHandler;
};

