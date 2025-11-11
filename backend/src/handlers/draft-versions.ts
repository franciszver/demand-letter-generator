import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RefinementHistoryModel } from '../models/RefinementHistory';
import { DraftLetterModel } from '../models/DraftLetter';

export const getRefinementHistoryHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const draftId = req.params.id;

    const draft = await DraftLetterModel.findById(draftId);
    if (!draft) {
      res.status(404).json({
        success: false,
        error: 'Draft letter not found',
      });
      return;
    }

    // Check access
    if (draft.userId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const history = await RefinementHistoryModel.findByDraftLetterId(draftId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get refinement history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get refinement history',
    });
  }
};

export const handler = {
  getHistory: getRefinementHistoryHandler,
};

