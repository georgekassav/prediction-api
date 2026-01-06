import Joi from 'joi';

export const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
}).min(1);

export const userIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
