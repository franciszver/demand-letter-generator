import { TimeTrackingModel } from '../models/TimeTracking';
import { TimeTracking } from '../../../shared/types';

export type ActionType = 'upload' | 'generate' | 'refine' | 'export';

export class TimeTracker {
  private static activeTrackings: Map<string, TimeTracking> = new Map();

  /**
   * Start tracking time for an action
   */
  static async startTracking(
    userId: string,
    draftLetterId: string,
    actionType: ActionType,
    estimatedManualTime?: number
  ): Promise<string> {
    const tracking = await TimeTrackingModel.create({
      userId,
      draftLetterId,
      actionType,
      startTime: new Date().toISOString(),
      estimatedManualTime,
    });

    // Store in memory for quick access
    this.activeTrackings.set(tracking.id, tracking);

    return tracking.id;
  }

  /**
   * End tracking and calculate time saved
   */
  static async endTracking(
    trackingId: string,
    userReportedTime?: number
  ): Promise<TimeTracking | null> {
    const tracking = this.activeTrackings.get(trackingId);
    if (!tracking) {
      // Try to find in database
      const dbTracking = await TimeTrackingModel.update(trackingId, {
        endTime: new Date().toISOString(),
        userReportedTime,
      });
      if (dbTracking) {
        return this.calculateTimeSaved(dbTracking);
      }
      return null;
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(tracking.startTime);
    const endTimeDate = new Date(endTime);
    const actualTime = Math.round((endTimeDate.getTime() - startTime.getTime()) / 1000 / 60); // minutes

    const updated = await TimeTrackingModel.update(trackingId, {
      endTime,
      userReportedTime,
    });

    if (!updated) return null;

    this.activeTrackings.delete(trackingId);
    return this.calculateTimeSaved(updated);
  }

  /**
   * Calculate time saved for a tracking record
   */
  private static calculateTimeSaved(tracking: TimeTracking): TimeTracking {
    if (!tracking.endTime || !tracking.startTime) {
      return tracking;
    }

    const startTime = new Date(tracking.startTime);
    const endTime = new Date(tracking.endTime);
    const actualTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes

    // Use user-reported time if available, otherwise use estimated manual time, otherwise default
    const baseline = tracking.userReportedTime || tracking.estimatedManualTime || 180; // Default 3 hours
    const timeSaved = Math.max(0, baseline - actualTime - (tracking.userReportedTime || 0));

    return {
      ...tracking,
      timeSaved,
    };
  }

  /**
   * Get time saved statistics for a user or system-wide
   */
  static async getTimeSavedStats(userId?: string): Promise<{
    totalTimeSaved: number;
    totalLetters: number;
    averageTimeSaved: number;
  }> {
    return TimeTrackingModel.getTimeSavedStats(userId);
  }

  /**
   * Get tracking history for a draft letter
   */
  static async getDraftLetterTracking(draftLetterId: string): Promise<TimeTracking[]> {
    return TimeTrackingModel.findByDraftLetterId(draftLetterId);
  }

  /**
   * Get tracking history for a user
   */
  static async getUserTracking(userId: string, limit?: number): Promise<TimeTracking[]> {
    return TimeTrackingModel.findByUserId(userId, limit);
  }

  /**
   * Calculate total time for a draft letter (sum of all actions)
   */
  static async getTotalTimeForDraft(draftLetterId: string): Promise<number> {
    const trackings = await this.getDraftLetterTracking(draftLetterId);
    
    let totalMinutes = 0;
    for (const tracking of trackings) {
      if (tracking.startTime && tracking.endTime) {
        const start = new Date(tracking.startTime);
        const end = new Date(tracking.endTime);
        totalMinutes += Math.round((end.getTime() - start.getTime()) / 1000 / 60);
      }
    }

    return totalMinutes;
  }
}

