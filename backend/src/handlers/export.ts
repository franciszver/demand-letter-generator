import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { WordExporter } from '../services/word-exporter';
import { DocumentProcessor } from '../services/document-processor';

export const exportHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.body;

    if (!draftId) {
      res.status(400).json({ success: false, error: 'Draft ID is required' });
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
    let content = draftLetter.content;
    if (draftLetter.s3Key) {
      try {
        content = await DocumentProcessor.getProcessedText(draftLetter.s3Key);
      } catch (s3Error) {
        console.warn(`Failed to fetch content from S3 for draft ${draftId}, using database content:`, s3Error instanceof Error ? s3Error.message : 'Unknown error');
        // Continue with database content as fallback
      }
    }

    // Export to Word
    const filename = draftLetter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const result = await WordExporter.exportToWord(content, draftLetter.title, filename);

    res.json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    });
  }
};

export const handler = exportHandler;

