import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminAnalytics } from '../services/admin-analytics';
import { UserModel } from '../models/User';

// Middleware to check admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }
  next();
};

export const getMetricsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await AdminAnalytics.getMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get admin metrics',
    });
  }
};

export const getTimeSavedHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await AdminAnalytics.getTimeSavedStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Time saved stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get time saved statistics',
    });
  }
};

export const getUsersHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { db } = await import('../config/database');
    const { TimeTrackingModel } = await import('../models/TimeTracking');
    const { DraftLetterModel } = await import('../models/DraftLetter');
    
    const users = await db('users')
      .select('id', 'email', 'name', 'role', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const timeStats = await TimeTrackingModel.getTimeSavedStats(user.id);
        const drafts = await DraftLetterModel.findByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString(),
          lettersGenerated: drafts.length,
          timeSaved: timeStats.totalTimeSaved,
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users',
    });
  }
};

export const handler = {
  getMetrics: getMetricsHandler,
  getTimeSaved: getTimeSavedHandler,
  getUsers: getUsersHandler,
};

