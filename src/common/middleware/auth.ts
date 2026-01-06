import { Response, NextFunction } from 'express';
import passport from '../config/passport';
import { AuthenticatedRequest, AppError } from '../types';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: AuthenticatedRequest['user']) => {
      if (err) {
        return next(new AppError(401, 'Authentication error'));
      }

      if (!user) {
        return next(new AppError(401, 'Invalid or expired token'));
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};
