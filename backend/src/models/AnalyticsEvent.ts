import { db } from '../config/database';

export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  eventType: string;
  eventData: Record<string, any>;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export class AnalyticsEventModel {
  static async create(eventData: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent> {
    const [event] = await db('analytics_events')
      .insert({
        user_id: eventData.userId,
        event_type: eventData.eventType,
        event_data: JSON.stringify(eventData.eventData),
        entity_type: eventData.entityType,
        entity_id: eventData.entityId,
      })
      .returning('*');
    
    return this.mapToAnalyticsEvent(event);
  }

  static async findByEventType(eventType: string, startDate?: Date, endDate?: Date): Promise<AnalyticsEvent[]> {
    let query = db('analytics_events').where({ event_type: eventType });
    
    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }
    
    const events = await query.orderBy('created_at', 'desc');
    return events.map(this.mapToAnalyticsEvent);
  }

  static async findByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<AnalyticsEvent[]> {
    let query = db('analytics_events').where({ user_id: userId });
    
    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }
    
    const events = await query.orderBy('created_at', 'desc');
    return events.map(this.mapToAnalyticsEvent);
  }

  static async getEventCounts(startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
    let query = db('analytics_events').select('event_type').count('* as count').groupBy('event_type');
    
    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }
    
    const results = await query;
    const counts: Record<string, number> = {};
    results.forEach((row: any) => {
      counts[row.event_type] = parseInt(row.count, 10);
    });
    return counts;
  }

  static async getDailyEventCounts(eventType: string, days: number = 30): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const results = await db('analytics_events')
      .where({ event_type: eventType })
      .where('created_at', '>=', startDate)
      .select(db.raw("DATE(created_at) as date"))
      .count('* as count')
      .groupBy(db.raw("DATE(created_at)"))
      .orderBy('date', 'asc');
    
    return results.map((row: any) => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count, 10),
    }));
  }

  private static mapToAnalyticsEvent(row: any): AnalyticsEvent {
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      eventData: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data,
      entityType: row.entity_type,
      entityId: row.entity_id,
      createdAt: row.created_at.toISOString(),
    };
  }
}

