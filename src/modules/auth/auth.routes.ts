import { Router, Request, Response, NextFunction } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { registerSchema, loginSchema } from './auth.schemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, (req: Request, res: Response, next: NextFunction) => {
  authController.me(req, res, next);
});

export default router;
