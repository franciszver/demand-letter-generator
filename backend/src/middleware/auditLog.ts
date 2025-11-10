import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const auditLog = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip,
    };

    // In production, send to CloudWatch or logging service
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.log('Audit:', log);
    }
  });

  next();
};

