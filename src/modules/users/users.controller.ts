import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AppError } from '../../common/types';

class UsersController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await usersService.getByIdOrFail(id);

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new AppError(401, 'Not authenticated'));
      }

      const { email, username } = req.body;
      const user = await usersService.updateUser(req.user.id, { email, username });

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
