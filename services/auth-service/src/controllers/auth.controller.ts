import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { validateLoginInput, validateRegisterInput } from '../validation/auth.validation';
import { generateOTP } from '../utils/otp';
import { sendOTP } from '../services/sms.service';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const { firstName, lastName, email, mobile, deviceId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: { mobile: ['Mobile number already registered'] }
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      mobile,
      deviceId,
      password: await bcrypt.hash(otp.toString(), 10),
      role: 'USER',
      status: 'PENDING'
    });

    await user.save();

    // Send OTP via SMS
    await sendOTP(mobile, otp);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. OTP sent to your mobile number.'
    });
  } catch (error) {
    logger.error('Error in register controller:', error);
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const { mobile, deviceId } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        success: false,
        errors: { mobile: ['User not found'] }
      });
    }

    // Update device ID if provided
    if (deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    // Generate OTP
    const otp = generateOTP();

    // Update user password with OTP
    user.password = await bcrypt.hash(otp.toString(), 10);
    await user.save();

    // Send OTP via SMS
    await sendOTP(mobile, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your mobile number'
    });
  } catch (error) {
    logger.error('Error in login controller:', error);
    next(error);
  }
};

/**
 * Verify OTP and generate JWT token
 * @route POST /api/auth/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobile, otp } = req.body;

    // Validate input
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        errors: {
          message: ['Mobile and OTP are required']
        }
      });
    }

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        success: false,
        errors: { mobile: ['User not found'] }
      });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp.toString(), user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errors: { otp: ['Invalid OTP'] }
      });
    }

    // Update user status if pending
    if (user.status === 'PENDING') {
      user.status = 'ACTIVE';
      await user.save();
    }

    // Generate JWT token
    const payload = {
      id: user.id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    logger.error('Error in verifyOTP controller:', error);
    next(error);
  }
};

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Refresh token is required'] }
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret'
    ) as { id: string };

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Generate new JWT token
    const payload = {
      id: user.id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Error in refreshToken controller:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        errors: { message: ['Invalid refresh token'] }
      });
    }
    next(error);
  }
};

/**
 * Logout user (revoke token)
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // No server-side token storage for now, so nothing to do here
    // In a real-world app, you would revoke the token

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Error in logout controller:', error);
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is already attached to req by passport middleware
    const user = req.user as any;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getCurrentUser controller:', error);
    next(error);
  }
};