// services/auth-service/src/utils/error.ts
export class AppError extends Error {
    statusCode: number;
    
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export const createError = (statusCode: number, message: string) => {
    return new AppError(statusCode, message);
  };