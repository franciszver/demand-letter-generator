import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { db } from '../../config/database';

export const getHealthHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const startTime = Date.now();
      await db.raw('SELECT 1');
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Get recent error count (from analytics events with error types, or from logs)
    // For now, we'll use a simple approach
    const recentErrors = 0; // TODO: Implement error tracking

    // Get active sessions count
    const activeSessions = await db('sessions')
      .where({ is_active: true })
      .count('* as count')
      .first();
    const activeSessionsCount = parseInt(activeSessions?.count || '0', 10);

    // Get system uptime (approximate - time since server started)
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'operational' : 'degraded',
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        system: {
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
        },
        metrics: {
          activeSessions: activeSessionsCount,
          recentErrors,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get health error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status',
    });
  }
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

