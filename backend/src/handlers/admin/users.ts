import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { UserModel } from '../../models/User';
import bcrypt from 'bcryptjs';

export const getUsersHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users',
    });
  }
};

export const createUserHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Email, password, and name are required' });
      return;
    }

    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await UserModel.create({
      email,
      name,
      role: role || 'attorney',
      passwordHash,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
};

export const updateUserHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: 'User ID is required' });
      return;
    }

    const updates: any = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (role) updates.role = role;

    const user = await UserModel.update(id, updates);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
};

export const deleteUserHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'User ID is required' });
      return;
    }

    // Don't allow deleting yourself
    if (id === req.user!.id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    // TODO: Implement soft delete or hard delete
    // For now, we'll just return success (actual deletion would require cascade handling)
    res.json({
      success: true,
      message: 'User deletion not yet implemented',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
};

