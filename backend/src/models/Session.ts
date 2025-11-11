import { db } from '../config/database';
import { Session } from '../../../shared/types';

export class SessionModel {
  static async create(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const [session] = await db('sessions')
      .insert({
        draft_letter_id: sessionData.draftLetterId,
        user_id: sessionData.userId,
        is_active: sessionData.isActive,
        last_activity: new Date(),
      })
      .returning('*');
    
    return this.mapToSession(session);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<Session[]> {
    const sessions = await db('sessions')
      .where({ draft_letter_id: draftLetterId, is_active: true })
      .orderBy('last_activity', 'desc');
    return sessions.map(this.mapToSession);
  }

  static async updateActivity(id: string): Promise<Session | null> {
    const [session] = await db('sessions')
      .where({ id })
      .update({
        last_activity: new Date(),
      })
      .returning('*');
    
    if (!session) return null;
    return this.mapToSession(session);
  }

  static async deactivate(id: string): Promise<boolean> {
    const updated = await db('sessions')
      .where({ id })
      .update({ is_active: false });
    return updated > 0;
  }

  /**
   * Cleanup inactive sessions (older than 1 minute)
   * Should be called periodically
   */
  static async cleanupInactiveSessions(): Promise<number> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const deleted = await db('sessions')
      .where('last_activity', '<', oneMinuteAgo.toISOString())
      .orWhere({ is_active: false })
      .delete();
    return deleted;
  }

  private static mapToSession(row: any): Session {
    return {
      id: row.id,
      draftLetterId: row.draft_letter_id,
      userId: row.user_id,
      isActive: row.is_active,
      lastActivity: row.last_activity.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}

