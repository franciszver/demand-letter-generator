import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { RefinementHistoryModel } from '../models/RefinementHistory';
import { LetterMetricsModel } from '../models/LetterMetrics';
import { AIRefiner } from '../services/ai-refiner';
import { DocumentProcessor } from '../services/document-processor';
import { MetricsCalculator } from '../services/metrics-calculator';
import { TimeTracker } from '../services/time-tracker';
import { uploadToS3 } from '../config/s3';
import { RefineRequestWithHistory } from '../../../shared/types';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export const refineHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  let trackingId: string | null = null;

  try {
    const userId = req.user!.id;
    const { draftId, instructions, trackHistory = true }: RefineRequestWithHistory = req.body;

    if (!draftId || !instructions) {
      res.status(400).json({ success: false, error: 'Draft ID and instructions are required' });
      return;
    }

    // Get draft letter
    const draftLetter = await DraftLetterModel.findById(draftId);
    if (!draftLetter) {
      res.status(404).json({ success: false, error: 'Draft letter not found' });
      return;
    }

    if (draftLetter.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Start time tracking
    trackingId = await TimeTracker.startTracking(
      userId,
      draftId,
      'refine',
      30 // Estimated 30 minutes for manual refinement
    );

    // Get full content from S3, fall back to database content if S3 fails
    let currentContent = draftLetter.content;
    if (draftLetter.s3Key) {
      try {
        currentContent = await DocumentProcessor.getProcessedText(draftLetter.s3Key);
      } catch (s3Error) {
        console.warn(`Failed to fetch content from S3 for draft ${draftId}, using database content:`, s3Error instanceof Error ? s3Error.message : 'Unknown error');
        // Continue with database content as fallback
      }
    }

    // Get metrics before refinement if tracking history
    let metricsBefore = null;
    if (trackHistory) {
      metricsBefore = await LetterMetricsModel.findLatestByDraftLetterId(draftId);
      if (!metricsBefore) {
        // Calculate if doesn't exist
        const calculated = await MetricsCalculator.calculateMetrics(currentContent);
        metricsBefore = await LetterMetricsModel.create(
          MetricsCalculator.toLetterMetrics(draftId, calculated)
        );
      }
    }

    // Refine letter with EQ enhancement
    const refinedContent = await AIRefiner.refineLetter(currentContent, instructions, userId, draftId);

    // Store refined content in S3
    const refinedS3Key = `letters/${userId}/${Date.now()}-refined-${draftId}.txt`;
    await uploadToS3(PROCESSED_BUCKET, refinedS3Key, refinedContent, 'text/plain');

    // Update draft letter
    const updatedDraft = await DraftLetterModel.update(draftId, {
      content: refinedContent,
      s3Key: refinedS3Key,
      status: 'refined',
    });

    if (!updatedDraft) {
      res.status(500).json({ success: false, error: 'Failed to update draft letter' });
      return;
    }

    // Calculate metrics after refinement
    const metricsAfterAnalysis = await MetricsCalculator.calculateMetrics(refinedContent);
    const metricsAfter = await LetterMetricsModel.create(
      MetricsCalculator.toLetterMetrics(draftId, metricsAfterAnalysis)
    );

    // Track refinement history
    if (trackHistory) {
      await RefinementHistoryModel.create({
        draftLetterId: draftId,
        userId,
        promptText: instructions,
        responseText: refinedContent.substring(0, 1000), // Store summary
        version: updatedDraft.version,
        metricsBefore: metricsBefore || undefined,
        metricsAfter,
      });
    }

    // End time tracking
    if (trackingId) {
      await TimeTracker.endTracking(trackingId);
    }

    res.json({
      success: true,
      data: {
        draftId: updatedDraft.id,
        content: refinedContent,
        version: updatedDraft.version,
        metrics: metricsAfterAnalysis,
      },
    });
  } catch (error) {
    console.error('Refine error:', error);
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
      error: error instanceof Error ? error.message : 'Letter refinement failed',
    });
  }
};

export const handler = refineHandler;

