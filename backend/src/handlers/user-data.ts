import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { DraftLetterModel } from '../models/DraftLetter';
import { TemplateModel } from '../models/Template';
import { DocumentModel } from '../models/Document';
import { AnalyticsEventModel } from '../models/AnalyticsEvent';

export const exportUserDataHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Collect all user data
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const drafts = await DraftLetterModel.findByUserId(userId);
    const templates = await TemplateModel.findAll(); // All templates (shared)
    const documents = await DocumentModel.findByUserId(userId);
    const analyticsEvents = await AnalyticsEventModel.findByUserId(userId);

    // Format export data (excluding sensitive information)
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      drafts: drafts.map(draft => ({
        id: draft.id,
        title: draft.title,
        status: draft.status,
        version: draft.version,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        // Note: Full content is stored in S3, not included in export for size reasons
        // Users can access content via the API
      })),
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
      analytics: analyticsEvents.map(event => ({
        eventType: event.eventType,
        createdAt: event.createdAt,
        // Exclude detailed event data for privacy
      })),
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        // Note: Template content is shared, included for reference
      })),
    };

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);

    // Send JSON directly (not wrapped in success/data)
    res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export user data',
    });
  }
};

