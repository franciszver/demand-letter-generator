import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { DraftLetterVersionModel } from '../models/DraftLetterVersion';
import { DocumentProcessor } from '../services/document-processor';
import { uploadToS3 } from '../config/s3';
import { AnalyticsService } from '../services/analytics';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export const getDraftHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const draft = await DraftLetterModel.findById(id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Try to get full content from S3, fall back to database content if S3 fails
    let content = draft.content; // Default to content from database
    if (draft.s3Key) {
      try {
        content = await DocumentProcessor.getProcessedText(draft.s3Key);
      } catch (s3Error) {
        console.warn(`Failed to fetch content from S3 for draft ${id}, using database content:`, s3Error instanceof Error ? s3Error.message : 'Unknown error');
        // Continue with database content as fallback
      }
    }

    res.json({
      success: true,
      data: {
        ...draft,
        content,
      },
    });
  } catch (error) {
    console.error('Get draft error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get draft';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Failed to get draft',
      ...(process.env.NODE_ENV === 'development' && { details: errorStack }),
    });
  }
};

export const listDraftsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const drafts = await DraftLetterModel.findByUserId(userId);

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    console.error('List drafts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list drafts',
    });
  }
};

export const updateDraftHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    // Get existing draft
    const draft = await DraftLetterModel.findById(id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Update content in S3 (use existing s3Key or create new one)
    let s3Key = draft.s3Key;
    if (!s3Key || !s3Key.startsWith('letters/')) {
      // Create new S3 key if it doesn't exist or is in wrong format
      s3Key = `letters/${userId}/${Date.now()}-${id}.txt`;
    }

    // Upload updated content to S3
    await uploadToS3(PROCESSED_BUCKET, s3Key, content, 'text/plain');

    // Update draft in database
    const updatedDraft = await DraftLetterModel.updateContent(id, content, s3Key);

    if (!updatedDraft) {
      res.status(500).json({ success: false, error: 'Failed to update draft' });
      return;
    }

    // Create version snapshot (every 5 versions or on major changes)
    if (updatedDraft.version % 5 === 0) {
      try {
        await DraftLetterVersionModel.create({
          draftLetterId: id,
          versionNumber: updatedDraft.version,
          content,
          s3Key,
          createdBy: userId,
          changeSummary: `Auto-saved version ${updatedDraft.version}`,
        });
      } catch (error) {
        console.error('Failed to create version snapshot:', error);
        // Don't fail the request if versioning fails
      }
    }

    // Track analytics (throttled - only track every 10th save to avoid spam)
    if (updatedDraft.version % 10 === 0) {
      await AnalyticsService.trackLetterSaved(userId, id);
    }

    res.json({
      success: true,
      data: {
        ...updatedDraft,
        content, // Return full content
      },
    });
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update draft',
    });
  }
};

export const handler = {
  get: getDraftHandler,
  list: listDraftsHandler,
  update: updateDraftHandler,
};

