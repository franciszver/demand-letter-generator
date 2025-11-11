import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LetterMetricsModel } from '../models/LetterMetrics';
import { MetricsCalculator } from '../services/metrics-calculator';
import { DraftLetterModel } from '../models/DraftLetter';
import { DocumentProcessor } from '../services/document-processor';

export const getDraftMetricsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get latest metrics
    let metrics = await LetterMetricsModel.findLatestByDraftLetterId(draftId);

    // If no metrics exist, calculate them
    if (!metrics) {
      let content = draft.content;
      if (draft.s3Key) {
        try {
          content = await DocumentProcessor.getProcessedText(draft.s3Key);
        } catch (error) {
          console.warn('Failed to fetch content from S3, using database content');
        }
      }

      const calculatedMetrics = await MetricsCalculator.calculateMetrics(content);
      metrics = await LetterMetricsModel.create(
        MetricsCalculator.toLetterMetrics(draftId, calculatedMetrics)
      );
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get draft metrics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get draft metrics',
    });
  }
};

export const calculateMetricsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { draftId, content } = req.body;

    if (!draftId && !content) {
      res.status(400).json({
        success: false,
        error: 'Either draftId or content is required',
      });
      return;
    }

    let letterContent = content;

    // If draftId provided, fetch content
    if (draftId) {
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

      if (draft.s3Key) {
        try {
          letterContent = await DocumentProcessor.getProcessedText(draft.s3Key);
        } catch (error) {
          letterContent = draft.content;
        }
      } else {
        letterContent = draft.content;
      }
    }

    if (!letterContent) {
      res.status(400).json({
        success: false,
        error: 'Letter content is required',
      });
      return;
    }

    const calculatedMetrics = await MetricsCalculator.calculateMetrics(letterContent);

    // Save metrics if draftId provided
    if (draftId) {
      const existing = await LetterMetricsModel.findLatestByDraftLetterId(draftId);
      if (existing) {
        await LetterMetricsModel.update(draftId, calculatedMetrics);
      } else {
        await LetterMetricsModel.create(
          MetricsCalculator.toLetterMetrics(draftId, calculatedMetrics)
        );
      }
    }

    res.json({
      success: true,
      data: calculatedMetrics,
    });
  } catch (error) {
    console.error('Calculate metrics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate metrics',
    });
  }
};

export const handler = {
  getDraftMetrics: getDraftMetricsHandler,
  calculate: calculateMetricsHandler,
};

