import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JWT_SECRET, NODE_ENV } from '../config/env';
import { AUTH_COOKIE_NAME } from '../config/constant';

export const saveTokenInCookie = (res: Response, id: string) => {
  const token = jwt.sign({ id }, JWT_SECRET);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    signed: true,
    secure: NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
