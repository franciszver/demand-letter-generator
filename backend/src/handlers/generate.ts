import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DocumentModel } from '../models/Document';
import { DraftLetterModel } from '../models/DraftLetter';
import { CaseContextModel } from '../models/CaseContext';
import { AIGenerator } from '../services/ai-generator';
import { DocumentProcessor } from '../services/document-processor';
import { TimeTracker } from '../services/time-tracker';
import { MetricsCalculator } from '../services/metrics-calculator';
import { LetterMetricsModel } from '../models/LetterMetrics';
import { uploadToS3 } from '../config/s3';
import { GenerateRequestWithEQ } from '../../../shared/types';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export const generateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  let trackingId: string | null = null;

  try {
    const userId = req.user!.id;
    const { documentId, templateId, caseContext }: GenerateRequestWithEQ = req.body;

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

    // Create draft letter record first (for case context and tracking)
    const draftLetter = await DraftLetterModel.create({
      userId,
      documentId,
      templateId,
      title: `Demand Letter - ${document.originalName}`,
      content: '', // Will be updated
      s3Key: '', // Will be updated
      status: 'draft',
    });

    // Start time tracking with actual draftId
    trackingId = await TimeTracker.startTracking(
      userId,
      draftLetter.id,
      'generate',
      180 // Default 3 hours estimated manual time
    );

    // Save case context if provided
    if (caseContext) {
      await CaseContextModel.create({
        draftLetterId: draftLetter.id,
        userId,
        relationshipDynamics: caseContext.relationshipDynamics,
        urgencyLevel: caseContext.urgencyLevel ?? 5,
        previousInteractions: caseContext.previousInteractions,
        caseSensitivity: caseContext.caseSensitivity,
        targetRecipientRole: caseContext.targetRecipientRole,
        targetRecipientOrg: caseContext.targetRecipientOrg,
        targetRelationship: caseContext.targetRelationship,
      });
    }

    // Generate letter with EQ enhancement
    const result = await AIGenerator.generateLetter(analysis, templateId, userId, draftLetter.id);

    // Store letter content in S3
    const letterS3Key = `letters/${userId}/${Date.now()}-${documentId}.txt`;
    await uploadToS3(PROCESSED_BUCKET, letterS3Key, result.content, 'text/plain');

    // Update draft letter with content
    const updatedDraft = await DraftLetterModel.update(draftLetter.id, {
      content: result.content,
      s3Key: letterS3Key,
      status: 'generated',
    });

    if (!updatedDraft) {
      throw new Error('Failed to update draft letter');
    }

    // Calculate and save metrics
    const metrics = await MetricsCalculator.calculateMetrics(result.content);
    await LetterMetricsModel.create(
      MetricsCalculator.toLetterMetrics(updatedDraft.id, metrics)
    );

    // End time tracking
    if (trackingId) {
      await TimeTracker.endTracking(trackingId);
    }

    res.json({
      success: true,
      data: {
        draftId: updatedDraft.id,
        content: result.content,
        analysis: result.analysis,
        metrics,
        version: updatedDraft.version, // Include version for conflict tracking
      },
    });
  } catch (error) {
    console.error('Generate error:', error);
    // End tracking even on error
    if (trackingId) {
      try {
        await TimeTracker.endTracking(trackingId);
      } catch (trackError) {
        console.error('Failed to end tracking:', trackError);
      }
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Letter generation failed',
    });
  }
};

export const handler = generateHandler;

