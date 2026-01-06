import { Router, Request, Response, NextFunction } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { updateUserSchema } from './users.schemas';

const router = Router();

router.get('/:id', usersController.getById);
router.patch('/me', authenticate, validate(updateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  usersController.updateMe(req, res, next);
});

export default router;
