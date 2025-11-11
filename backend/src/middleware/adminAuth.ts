import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to ensure user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
};

