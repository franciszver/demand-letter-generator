import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { DocumentProcessor } from '../services/document-processor';
import { ConflictResolver } from '../services/conflict-resolver';

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
    const { content, expectedVersion } = req.body;

    if (!content || expectedVersion === undefined) {
      res.status(400).json({
        success: false,
        error: 'Content and expectedVersion are required',
      });
      return;
    }

    // Use ConflictResolver to save with version check
    const result = await ConflictResolver.saveWithConflictCheck(
      id,
      content,
      userId,
      expectedVersion
    );

    if (result.conflict) {
      res.status(409).json({
        success: false,
        error: 'Conflict: Document was modified by another user',
        conflict: true,
        currentVersion: result.currentVersion,
        serverContent: result.serverContent,
      });
      return;
    }

    if (!result.success || !result.draft) {
      res.status(500).json({
        success: false,
        error: 'Failed to update draft',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        draft: result.draft,
        version: result.newVersion,
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

