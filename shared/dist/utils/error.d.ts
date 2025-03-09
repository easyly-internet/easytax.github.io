export declare class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare const createError: (statusCode: number, message: string) => AppError;
