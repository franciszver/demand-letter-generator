import { AnalyticsEventModel } from '../models/AnalyticsEvent';

export type EventType = 
  | 'letter_generated'
  | 'letter_refined'
  | 'letter_exported'
  | 'letter_saved'
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
  | 'document_uploaded'
  | 'user_registered'
  | 'user_logged_in';

export interface EventData {
  [key: string]: any;
}

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent(
    eventType: EventType,
    userId: string | null,
    eventData: EventData = {},
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      await AnalyticsEventModel.create({
        userId,
        eventType,
        eventData,
        entityType: entityType || null,
        entityId: entityId || null,
      });
    } catch (error) {
      // Don't throw - analytics failures shouldn't break the app
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track letter generation
   */
  static async trackLetterGenerated(userId: string, draftId: string, templateId?: string): Promise<void> {
    await this.trackEvent('letter_generated', userId, {
      templateUsed: !!templateId,
      templateId,
    }, 'draft_letter', draftId);
  }

  /**
   * Track letter refinement
   */
  static async trackLetterRefined(userId: string, draftId: string): Promise<void> {
    await this.trackEvent('letter_refined', userId, {}, 'draft_letter', draftId);
  }

  /**
   * Track letter export
   */
  static async trackLetterExported(userId: string, draftId: string): Promise<void> {
    await this.trackEvent('letter_exported', userId, {}, 'draft_letter', draftId);
  }

  /**
   * Track letter save (auto-save)
   */
  static async trackLetterSaved(userId: string, draftId: string): Promise<void> {
    await this.trackEvent('letter_saved', userId, {}, 'draft_letter', draftId);
  }

  /**
   * Track template creation
   */
  static async trackTemplateCreated(userId: string, templateId: string): Promise<void> {
    await this.trackEvent('template_created', userId, {}, 'template', templateId);
  }

  /**
   * Track template update
   */
  static async trackTemplateUpdated(userId: string, templateId: string): Promise<void> {
    await this.trackEvent('template_updated', userId, {}, 'template', templateId);
  }

  /**
   * Track template deletion
   */
  static async trackTemplateDeleted(userId: string, templateId: string): Promise<void> {
    await this.trackEvent('template_deleted', userId, {}, 'template', templateId);
  }

  /**
   * Track document upload
   */
  static async trackDocumentUploaded(userId: string, documentId: string, fileType: string, fileSize: number): Promise<void> {
    await this.trackEvent('document_uploaded', userId, {
      fileType,
      fileSize,
    }, 'document', documentId);
  }

  /**
   * Track user registration
   */
  static async trackUserRegistered(userId: string): Promise<void> {
    await this.trackEvent('user_registered', userId, {});
  }

  /**
   * Track user login
   */
  static async trackUserLoggedIn(userId: string): Promise<void> {
    await this.trackEvent('user_logged_in', userId, {});
  }

  /**
   * Calculate estimated time saved (2-4 hours per letter)
   */
  static calculateTimeSaved(letterCount: number, hoursPerLetter: number = 3): number {
    return letterCount * hoursPerLetter;
  }

  /**
   * Calculate ROI based on attorney hourly rate
   */
  static calculateROI(timeSavedHours: number, hourlyRate: number = 250): number {
    return timeSavedHours * hourlyRate;
  }
}

