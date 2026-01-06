import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(400, message));
    }

    next();
  };
};
