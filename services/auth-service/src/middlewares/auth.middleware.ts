import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME } from '../config/constant';
import { ErrorResponse } from './error.middleware';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export const isAuthenticated = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.signedCookies[AUTH_COOKIE_NAME];
    if (!token) throw new ErrorResponse('Unauthorize user', 401);

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) throw new ErrorResponse('Invalid token', 401);
      const user = decoded as JwtPayload;
      if (user.id) {
        req.user = { id: user.id };
        next();
      } else {
        throw new ErrorResponse('Invalid token Payload', 403);
      }
    });
  } catch (error) {
    next(error);
  }
};
