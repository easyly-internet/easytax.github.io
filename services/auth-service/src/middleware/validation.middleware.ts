// services/auth-service/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from '../utils/error';

// Validate registration data
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(createError(400, error.details[0].message));
  }
  
  next();
};

// Validate login data
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(createError(400, error.details[0].message));
  }
  
  next();
};