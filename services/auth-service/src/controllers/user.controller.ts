// services/auth-service/src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { createError } from '../utils/error';

// Get user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, mobile } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, mobile },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};