// services/auth-service/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { createError } from '../utils/error';

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return next(createError(401, 'Unauthorized'));
    }
    
    req.user = user;
    next();
  })(req, res, next);
};