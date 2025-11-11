import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserProfileModel } from '../models/UserProfile';
import { UserProfile } from '../../../shared/types';

export const createOrUpdateUserProfileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profileData: Partial<UserProfile> = req.body;

    // Ensure userId matches authenticated user
    const profile = await UserProfileModel.upsert({
      userId,
      communicationStyle: profileData.communicationStyle,
      preferredTone: profileData.preferredTone,
      formalityLevel: profileData.formalityLevel ?? 7,
      urgencyTendency: profileData.urgencyTendency ?? 5,
      empathyPreference: profileData.empathyPreference ?? 5,
      notes: profileData.notes,
    });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create/update user profile',
    });
  }
};

export const getUserProfileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const targetUserId = req.params.id || userId;

    // Users can only view their own profile unless admin
    if (targetUserId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const profile = await UserProfileModel.findByUserId(targetUserId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
      return;
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user profile',
    });
  }
};

export const handler = {
  createOrUpdate: createOrUpdateUserProfileHandler,
  get: getUserProfileHandler,
};

