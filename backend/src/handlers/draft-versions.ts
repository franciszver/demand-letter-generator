import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { DraftLetterVersionModel } from '../models/DraftLetterVersion';
import { DocumentProcessor } from '../services/document-processor';

export const listVersionsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;

    // Verify user has access to this draft
    const draft = await DraftLetterModel.findById(draftId);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const versions = await DraftLetterVersionModel.findByDraftLetterId(draftId);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('List versions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list versions',
    });
  }
};

export const getVersionHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId, versionNumber } = req.params;

    // Verify user has access to this draft
    const draft = await DraftLetterModel.findById(draftId);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const version = await DraftLetterVersionModel.findByVersion(
      draftId,
      parseInt(versionNumber, 10)
    );

    if (!version) {
      res.status(404).json({ success: false, error: 'Version not found' });
      return;
    }

    // Get full content from S3 if available, otherwise use database content
    let content = version.content;
    if (version.s3Key) {
      try {
        content = await DocumentProcessor.getProcessedText(version.s3Key);
      } catch (s3Error) {
        console.warn(`Failed to fetch version content from S3, using database content:`, s3Error instanceof Error ? s3Error.message : 'Unknown error');
        // Continue with database content as fallback
      }
    }

    res.json({
      success: true,
      data: {
        ...version,
        content,
      },
    });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version',
    });
  }
};

export const createVersionHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;
    const { changeSummary } = req.body;

    // Verify user has access to this draft
    const draft = await DraftLetterModel.findById(draftId);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Get current content
    let content = draft.content;
    if (draft.s3Key) {
      try {
        content = await DocumentProcessor.getProcessedText(draft.s3Key);
      } catch (s3Error) {
        console.warn(`Failed to fetch content from S3, using database content:`, s3Error instanceof Error ? s3Error.message : 'Unknown error');
      }
    }

    // Create version snapshot
    const version = await DraftLetterVersionModel.create({
      draftLetterId: draftId,
      versionNumber: draft.version,
      content,
      s3Key: draft.s3Key,
      createdBy: userId,
      changeSummary: changeSummary || `Manual snapshot at version ${draft.version}`,
    });

    res.status(201).json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create version',
    });
  }
};

