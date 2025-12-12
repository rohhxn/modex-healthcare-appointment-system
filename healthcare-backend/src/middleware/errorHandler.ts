// @ts-nocheck
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    // Some build environments may not have Node typings installed; keep this safe.
    (Error as any).captureStackTrace?.(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // In development, return the error message and stack to help debugging.
  console.error('Unhandled error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    statusCode: 500,
    ...(isDev ? { stack: (err as Error).stack } : {}),
  });
};
