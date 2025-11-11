import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { TemplateModel } from '../../models/Template';
import { DraftLetterModel } from '../../models/DraftLetter';

export const getContentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all templates
    const templates = await TemplateModel.findAll();
    
    // Get all drafts (across all users for admin)
    const allDrafts = await DraftLetterModel.findAll();

    res.json({
      success: true,
      data: {
        templates,
        drafts: allDrafts,
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content',
    });
  }
};

