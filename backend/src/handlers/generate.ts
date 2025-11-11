import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DocumentModel } from '../models/Document';
import { DraftLetterModel } from '../models/DraftLetter';
import { AIGenerator } from '../services/ai-generator';
import { DocumentProcessor } from '../services/document-processor';
import { uploadToS3 } from '../config/s3';
import { AnalyticsService } from '../services/analytics';
import { GenerateRequest } from '../../../shared/types';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export const generateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { documentId, templateId }: GenerateRequest = req.body;

    if (!documentId) {
      res.status(400).json({ success: false, error: 'Document ID is required' });
      return;
    }

    // Get document
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (document.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (document.status !== 'completed') {
      res.status(400).json({ success: false, error: 'Document processing not completed' });
      return;
    }

    // Get processed text from S3
    const documentText = await DocumentProcessor.getProcessedText(document.s3Key);

    // Analyze document
    const analysis = await AIGenerator.analyzeDocument(documentText);

    // Generate letter
    const result = await AIGenerator.generateLetter(analysis, templateId);

    // Store letter content in S3
    const letterS3Key = `letters/${userId}/${Date.now()}-${documentId}.txt`;
    await uploadToS3(PROCESSED_BUCKET, letterS3Key, result.content, 'text/plain');

    // Create draft letter record
    const draftLetter = await DraftLetterModel.create({
      userId,
      documentId,
      templateId,
      title: `Demand Letter - ${document.originalName}`,
      content: result.content,
      s3Key: letterS3Key,
      status: 'generated',
    });

    // Track analytics
    await AnalyticsService.trackLetterGenerated(userId, draftLetter.id, templateId);

    // Trigger webhooks
    await WebhookService.triggerWebhooks('letter.created', {
      draftId: draftLetter.id,
      userId,
      title: draftLetter.title,
    });

    res.json({
      success: true,
      data: {
        draftId: draftLetter.id,
        content: result.content,
        analysis: result.analysis,
      },
    });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Letter generation failed',
    });
  }
};

export const handler = generateHandler;

