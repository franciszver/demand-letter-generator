import { db } from '../config/database';
import { TimeTrackingModel } from '../models/TimeTracking';
import { DraftLetterModel } from '../models/DraftLetter';
import { UserModel } from '../models/User';

export interface AdminMetrics {
  totalUsers: number;
  totalLetters: number;
  totalDocuments: number;
  totalTimeSaved: number;
  averageTimeSaved: number;
  lettersGeneratedToday: number;
  lettersGeneratedThisWeek: number;
  lettersGeneratedThisMonth: number;
  activeUsers: number;
  userActivity: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    lettersGenerated: number;
    timeSaved: number;
  }>;
}

export interface TimeSavedStats {
  totalTimeSaved: number;
  totalLetters: number;
  averageTimeSaved: number;
  timeSavedByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    timeSaved: number;
    lettersGenerated: number;
  }>;
  timeSavedByPeriod: Array<{
    period: string;
    timeSaved: number;
    lettersGenerated: number;
  }>;
}

export class AdminAnalytics {
  /**
   * Get comprehensive admin dashboard metrics
   */
  static async getMetrics(): Promise<AdminMetrics> {
    const [
      totalUsers,
      totalLetters,
      totalDocuments,
      timeStats,
      lettersToday,
      lettersThisWeek,
      lettersThisMonth,
      activeUsers,
    ] = await Promise.all([
      db('users').count('* as count').first(),
      db('draft_letters').count('* as count').first(),
      db('documents').count('* as count').first(),
      TimeTrackingModel.getTimeSavedStats(),
      this.getLettersGeneratedToday(),
      this.getLettersGeneratedThisWeek(),
      this.getLettersGeneratedThisMonth(),
      this.getActiveUsers(),
    ]);

    // Get user activity
    const userActivity = await this.getUserActivity();

    return {
      totalUsers: parseInt(String(totalUsers?.count || '0'), 10),
      totalLetters: parseInt(String(totalLetters?.count || '0'), 10),
      totalDocuments: parseInt(String(totalDocuments?.count || '0'), 10),
      totalTimeSaved: timeStats.totalTimeSaved,
      averageTimeSaved: Math.round(timeStats.averageTimeSaved),
      lettersGeneratedToday: lettersToday,
      lettersGeneratedThisWeek: lettersThisWeek,
      lettersGeneratedThisMonth: lettersThisMonth,
      activeUsers: activeUsers,
      userActivity,
    };
  }

  /**
   * Get detailed time saved statistics
   */
  static async getTimeSavedStats(): Promise<TimeSavedStats> {
    const systemStats = await TimeTrackingModel.getTimeSavedStats();

    // Get time saved by user
    const timeByUser = await db('time_tracking')
      .select('user_id')
      .sum('time_saved as total_time_saved')
      .count('* as letters_generated')
      .whereNotNull('time_saved')
      .groupBy('user_id');

    const userDetails = await Promise.all(
      timeByUser.map(async (row) => {
        const user = await UserModel.findById(row.user_id);
        return {
          userId: row.user_id,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          timeSaved: parseInt(row.total_time_saved || '0', 10),
          lettersGenerated: parseInt(row.letters_generated || '0', 10),
        };
      })
    );

    // Get time saved by period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeByPeriod = await db('time_tracking')
      .select(db.raw("DATE_TRUNC('day', created_at) as period"))
      .sum('time_saved as total_time_saved')
      .count('* as letters_generated')
      .where('created_at', '>=', thirtyDaysAgo)
      .whereNotNull('time_saved')
      .groupBy(db.raw("DATE_TRUNC('day', created_at)"))
      .orderBy('period', 'asc');

    return {
      totalTimeSaved: systemStats.totalTimeSaved,
      totalLetters: systemStats.totalLetters,
      averageTimeSaved: Math.round(systemStats.averageTimeSaved),
      timeSavedByUser: userDetails,
      timeSavedByPeriod: timeByPeriod.map((row: any) => ({
        period: row.period.toISOString().split('T')[0],
        timeSaved: parseInt(String(row.total_time_saved || '0'), 10),
        lettersGenerated: parseInt(String(row.letters_generated || '0'), 10),
      })),
    };
  }

  /**
   * Get letters generated today
   */
  private static async getLettersGeneratedToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db('draft_letters')
      .count('* as count')
      .where('created_at', '>=', today)
      .first();

    return parseInt(String(result?.count || '0'), 10);
  }

  /**
   * Get letters generated this week
   */
  private static async getLettersGeneratedThisWeek(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const result = await db('draft_letters')
      .count('* as count')
      .where('created_at', '>=', weekAgo)
      .first();

    return parseInt(String(result?.count || '0'), 10);
  }

  /**
   * Get letters generated this month
   */
  private static async getLettersGeneratedThisMonth(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const result = await db('draft_letters')
      .count('* as count')
      .where('created_at', '>=', monthAgo)
      .first();

    return parseInt(String(result?.count || '0'), 10);
  }

  /**
   * Get active users (users who generated letters in last 30 days)
   */
  private static async getActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db('draft_letters')
      .countDistinct('user_id as count')
      .where('created_at', '>=', thirtyDaysAgo)
      .first();

    return parseInt(String(result?.count || '0'), 10);
  }

  /**
   * Get user activity breakdown
   */
  private static async getUserActivity(): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    lettersGenerated: number;
    timeSaved: number;
  }>> {
    const userStats = await db('draft_letters')
      .select('user_id')
      .count('* as letters_generated')
      .groupBy('user_id')
      .orderBy('letters_generated', 'desc')
      .limit(20);

    const activity = await Promise.all(
      userStats.map(async (row: any) => {
        const userId = String(row.user_id);
        const user = await UserModel.findById(userId);
        const userTimeStats = await TimeTrackingModel.getTimeSavedStats(userId);

        return {
          userId: userId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          lettersGenerated: parseInt(String(row.letters_generated || '0'), 10),
          timeSaved: userTimeStats.totalTimeSaved,
        };
      })
    );

    return activity;
  }
}

