// src/middleware/auth.middleware.js
import axios from 'axios';


/**
 * Authentication middleware for verifying JWT tokens
 * This middleware relies on the auth-service for token validation
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Validate token with auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8081';
    
    const response = await axios.post(`${authServiceUrl}/api/auth/verify-token`, {
      token
    });
    
    // If token is valid, attach user info to request object
    if (response.data && response.data.success) {
      req.user = response.data.user;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific error from auth service
    if (error.response && error.response.data) {
      return res.status(401).json({
        success: false,
        message: error.response.data.message || 'Authentication failed'
      });
    }
    
    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
};

export default authenticate;