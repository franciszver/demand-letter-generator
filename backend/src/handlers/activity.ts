import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DraftLetterModel } from '../models/DraftLetter';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import { db } from '../config/database';

export const getDraftActivityHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: draftId } = req.params;

    // Verify draft exists and user has access
    const draft = await DraftLetterModel.findById(draftId);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    if (draft.userId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Get active sessions (last activity within 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const activeSessions = await db('sessions')
      .where({ draft_letter_id: draftId, is_active: true })
      .where('last_activity', '>=', thirtySecondsAgo.toISOString())
      .orderBy('last_activity', 'desc');

    // Get user details for active sessions
    const activeUsers = await Promise.all(
      activeSessions.map(async (session) => {
        const user = await UserModel.findById(session.user_id);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastActivity: session.last_activity,
        };
      })
    );

    // Filter out nulls
    const users = activeUsers.filter((u): u is NonNullable<typeof u> => u !== null);

    // Get last modified info
    let lastModifiedBy = null;
    if (draft.lastModifiedBy) {
      const modifier = await UserModel.findById(draft.lastModifiedBy);
      if (modifier) {
        lastModifiedBy = {
          id: modifier.id,
          name: modifier.name,
          email: modifier.email,
        };
      }
    }

    // Update current user's session activity
    const userSession = activeSessions.find(s => s.user_id === userId);
    if (userSession) {
      await SessionModel.updateActivity(userSession.id);
    } else {
      // Create new session for current user
      await SessionModel.create({
        draftLetterId: draftId,
        userId,
        isActive: true,
        lastActivity: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        activeUsers: users,
        currentVersion: draft.version,
        lastModifiedBy,
        lastModifiedAt: draft.lastModifiedAt,
      },
    });
  } catch (error) {
    console.error('Get draft activity error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get draft activity',
    });
  }
};

export const handler = {
  getDraftActivity: getDraftActivityHandler,
};

