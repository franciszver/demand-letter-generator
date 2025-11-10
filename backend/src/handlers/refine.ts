import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { AIRefiner } from '../services/ai-refiner';
import { DocumentProcessor } from '../services/document-processor';
import { uploadToS3 } from '../config/s3';
import { RefineRequest } from '../../../shared/types';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export const refineHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId, instructions }: RefineRequest = req.body;

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

    // Refine letter
    const refinedContent = await AIRefiner.refineLetter(currentContent, instructions);

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

    res.json({
      success: true,
      data: {
        draftId: updatedDraft.id,
        content: refinedContent,
        version: updatedDraft.version,
      },
    });
  } catch (error) {
    console.error('Refine error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Letter refinement failed',
    });
  }
};

export const handler = refineHandler;

