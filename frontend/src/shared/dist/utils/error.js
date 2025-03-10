"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const createError = (statusCode, message) => {
    return new AppError(statusCode, message);
};
exports.createError = createError;
//# sourceMappingURL=error.js.map