import { db } from '../config/database';
import { TimeTracking } from '../../../shared/types';

export class TimeTrackingModel {
  static async create(trackingData: Omit<TimeTracking, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeTracking> {
    const [tracking] = await db('time_tracking')
      .insert({
        user_id: trackingData.userId,
        draft_letter_id: trackingData.draftLetterId,
        action_type: trackingData.actionType,
        start_time: trackingData.startTime,
        end_time: trackingData.endTime,
        estimated_manual_time: trackingData.estimatedManualTime,
        user_reported_time: trackingData.userReportedTime,
        time_saved: trackingData.timeSaved,
      })
      .returning('*');
    
    return this.mapToTimeTracking(tracking);
  }

  static async update(id: string, updates: Partial<TimeTracking>): Promise<TimeTracking | null> {
    const [tracking] = await db('time_tracking')
      .where({ id })
      .update({
        ...(updates.endTime && { end_time: updates.endTime }),
        ...(updates.estimatedManualTime !== undefined && { estimated_manual_time: updates.estimatedManualTime }),
        ...(updates.userReportedTime !== undefined && { user_reported_time: updates.userReportedTime }),
        ...(updates.timeSaved !== undefined && { time_saved: updates.timeSaved }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!tracking) return null;
    return this.mapToTimeTracking(tracking);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<TimeTracking[]> {
    const trackings = await db('time_tracking')
      .where({ draft_letter_id: draftLetterId })
      .orderBy('start_time', 'asc');
    
    return trackings.map(this.mapToTimeTracking);
  }

  static async findByUserId(userId: string, limit?: number): Promise<TimeTracking[]> {
    let query = db('time_tracking')
      .where({ user_id: userId })
      .orderBy('start_time', 'desc');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const trackings = await query;
    return trackings.map(this.mapToTimeTracking);
  }

  static async getTimeSavedStats(userId?: string): Promise<{
    totalTimeSaved: number;
    totalLetters: number;
    averageTimeSaved: number;
  }> {
    let query = db('time_tracking')
      .whereNotNull('time_saved')
      .sum('time_saved as total_time_saved')
      .count('* as total_letters')
      .avg('time_saved as avg_time_saved')
      .first();
    
    if (userId) {
      query = query.where({ user_id: userId });
    }
    
    const stats = await query;
    
    if (!stats) {
      return {
        totalTimeSaved: 0,
        totalLetters: 0,
        averageTimeSaved: 0,
      };
    }
    
    return {
      totalTimeSaved: parseInt(String(stats.total_time_saved || '0'), 10),
      totalLetters: parseInt(String(stats.total_letters || '0'), 10),
      averageTimeSaved: parseFloat(String(stats.avg_time_saved || '0')),
    };
  }

  private static mapToTimeTracking(row: any): TimeTracking {
    return {
      id: row.id,
      userId: row.user_id,
      draftLetterId: row.draft_letter_id,
      actionType: row.action_type,
      startTime: row.start_time.toISOString(),
      endTime: row.end_time ? row.end_time.toISOString() : undefined,
      estimatedManualTime: row.estimated_manual_time,
      userReportedTime: row.user_reported_time,
      timeSaved: row.time_saved,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

