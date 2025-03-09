// services/ai-service/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  message: string;
  stack?: string;
  statusCode?: number;
}

/**
 * Global error handling middleware
 */
const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  
  const errorResponse: ErrorResponse = {
    message: err.message || 'Server Error',
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
};

export default errorHandler;