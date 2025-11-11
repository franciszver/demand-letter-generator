import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AnalyticsEventModel } from '../../models/AnalyticsEvent';
import { AnalyticsService } from '../../services/analytics';
import { UserModel } from '../../models/User';
import { DraftLetterModel } from '../../models/DraftLetter';
import { TemplateModel } from '../../models/Template';

export const getAnalyticsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get event counts
    const eventCounts = await AnalyticsEventModel.getEventCounts(startDate);

    // Get daily letter generation counts
    const dailyGenerations = await AnalyticsEventModel.getDailyEventCounts('letter_generated', daysNum);

    // Get total counts
    const totalUsers = (await UserModel.findAll()).length;
    const totalDrafts = (await DraftLetterModel.findAll()).length;
    const totalTemplates = (await TemplateModel.findAll()).length;

    // Calculate metrics
    const lettersGenerated = eventCounts['letter_generated'] || 0;
    const lettersExported = eventCounts['letter_exported'] || 0;
    const lettersRefined = eventCounts['letter_refined'] || 0;
    const timeSavedHours = AnalyticsService.calculateTimeSaved(lettersGenerated);
    const estimatedROI = AnalyticsService.calculateROI(timeSavedHours);

    // Get active users (users who logged in within the period)
    const recentLogins = await AnalyticsEventModel.findByEventType('user_logged_in', startDate);
    const activeUserIds = new Set(recentLogins.map(e => e.userId).filter(Boolean));
    const activeUsers = activeUserIds.size;

    // Get template usage
    const templateEvents = await AnalyticsEventModel.findByEventType('letter_generated', startDate);
    const templateUsage: Record<string, number> = {};
    templateEvents.forEach(event => {
      const templateId = event.eventData?.templateId;
      if (templateId) {
        templateUsage[templateId] = (templateUsage[templateId] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          totalDrafts,
          totalTemplates,
          lettersGenerated,
          lettersExported,
          lettersRefined,
          timeSavedHours,
          estimatedROI,
        },
        dailyGenerations,
        eventCounts,
        templateUsage,
        period: {
          days: daysNum,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    });
  }
};

