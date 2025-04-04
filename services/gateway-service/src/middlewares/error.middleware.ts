import { NextFunction, Request, Response } from 'express';
import { NODE_ENV } from '../config/env';
import { ZodError } from 'zod';
import multer from 'multer';

export class ErrorResponse extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (
  err: ErrorResponse | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (NODE_ENV === 'development') {
    console.error('Error: ', err);
    console.error('Error Stack:', err.stack);
  }

  if (err instanceof ErrorResponse) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({
          message: 'File too large, Maximum size is 5MB.',
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          message: 'Unexpected field name for file upload',
        });
        return;
      default:
        res.status(400).json({
          message: `File upload error: ${err.message}`,
        });
    }
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Input Validation error',
      errors: formattedErrors,
    });
    return;
  }

  if ((err as any).code === 'ECONNREFUSED') {
    res.status(503).json({
      success: false,
      message: 'Service unavailable, Please try again later.',
    });
    return;
  }

  // Default error
  const message = res.locals.errorMessage || 'Internal server error';
  res.status(500).json({ success: false, message });
  return;
};
