import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { config } from '../config/config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    status: 'error',
    message: config.IS_PRODUCTION ? 'Internal server error' : err.message,
  });
};
