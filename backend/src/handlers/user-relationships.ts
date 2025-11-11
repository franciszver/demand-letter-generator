import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserRelationshipModel } from '../models/UserRelationship';
import { UserModel } from '../models/User';
import { UserRelationship } from '../../../shared/types';

export const createRelationshipHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const primaryUserId = req.user!.id;
    const { secondaryUserId } = req.body;

    if (!secondaryUserId) {
      res.status(400).json({
        success: false,
        error: 'Secondary user ID is required',
      });
      return;
    }

    // Check if user is attorney or admin (only they can create relationships)
    if (req.user!.role !== 'attorney' && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only attorneys and admins can create user relationships',
      });
      return;
    }

    // Check if secondary user exists
    const secondaryUser = await UserModel.findById(secondaryUserId);
    if (!secondaryUser) {
      res.status(404).json({
        success: false,
        error: 'Secondary user not found',
      });
      return;
    }

    // Check if relationship already exists
    const existing = await UserRelationshipModel.findRelationship(primaryUserId, secondaryUserId);
    if (existing) {
      // Reactivate if inactive
      if (existing.status === 'inactive') {
        const updated = await UserRelationshipModel.update(existing.id, { status: 'active' });
        res.json({
          success: true,
          data: updated,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'Relationship already exists',
      });
      return;
    }

    const relationship = await UserRelationshipModel.create({
      primaryUserId,
      secondaryUserId,
      status: 'active',
    });

    res.json({
      success: true,
      data: relationship,
    });
  } catch (error) {
    console.error('Create relationship error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create relationship',
    });
  }
};

export const listRelationshipsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get relationships where user is primary or secondary
    const [asPrimary, asSecondary] = await Promise.all([
      UserRelationshipModel.findByPrimaryUserId(userId),
      UserRelationshipModel.findBySecondaryUserId(userId),
    ]);

    // Enrich with user details
    const enriched = await Promise.all([
      ...asPrimary.map(async (rel) => {
        const secondaryUser = await UserModel.findById(rel.secondaryUserId);
        return {
          ...rel,
          secondaryUser: secondaryUser ? {
            id: secondaryUser.id,
            name: secondaryUser.name,
            email: secondaryUser.email,
            role: secondaryUser.role,
          } : null,
        };
      }),
      ...asSecondary.map(async (rel) => {
        const primaryUser = await UserModel.findById(rel.primaryUserId);
        return {
          ...rel,
          primaryUser: primaryUser ? {
            id: primaryUser.id,
            name: primaryUser.name,
            email: primaryUser.email,
            role: primaryUser.role,
          } : null,
        };
      }),
    ]);

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('List relationships error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list relationships',
    });
  }
};

export const deactivateRelationshipHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { secondaryUserId } = req.body || {};

    if (!secondaryUserId) {
      res.status(400).json({
        success: false,
        error: 'Secondary user ID is required',
      });
      return;
    }

    const relationship = await UserRelationshipModel.findRelationship(userId, secondaryUserId);
    if (!relationship) {
      res.status(404).json({
        success: false,
        error: 'Relationship not found',
      });
      return;
    }

    // Check if user is the primary user or admin
    if (relationship.primaryUserId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const updated = await UserRelationshipModel.update(relationship.id, { status: 'inactive' });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Deactivate relationship error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate relationship',
    });
  }
};

export const handler = {
  create: createRelationshipHandler,
  list: listRelationshipsHandler,
  deactivate: deactivateRelationshipHandler,
};

