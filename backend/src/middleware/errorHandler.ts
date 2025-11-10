import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error
  console.error('Error:', err);

  // Send error response
  res.status(500).json({
    success: false,
    error: isDevelopment ? err.message : 'An internal server error occurred',
    ...(isDevelopment && { stack: err.stack }),
  });
};

