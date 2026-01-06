import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../common/types';
import { config } from '../../common/config/config';
import { jwtConfig } from '../../common/config/jwt';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: jwtConfig.refreshExpiresIn * 1000, // Convert to milliseconds
  path: '/',
};

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;
      const user = await authService.createUser(email, username, password);

      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const tokens = await authService.loginUser(email, password);

      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

      res.json({
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        return next(new AppError(401, 'No refresh token provided'));
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

      res.json({
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Not authenticated'));
      }

      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (refreshToken) {
        await authService.logoutUser(refreshToken, req.user.id);
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

      res.json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Not authenticated'));
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
