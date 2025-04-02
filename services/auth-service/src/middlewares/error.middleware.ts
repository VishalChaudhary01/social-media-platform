import { NextFunction, Request, Response } from 'express';
import { NODE_ENV } from '../config/env';

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
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal server error';

  if (NODE_ENV === 'development') {
    console.error('Error: ', err);
  }

  res.status(statusCode).json({ success: false, message });
};
