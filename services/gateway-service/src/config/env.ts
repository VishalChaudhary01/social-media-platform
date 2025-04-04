import { config } from 'dotenv';
import fs from 'fs';

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;

if (fs.existsSync(envFile)) {
  config({ path: envFile });
} else {
  throw new Error(`❌ Missing environment file: ${envFile}`);
}

export const PORT = process.env.PORT || '5003';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'mysecret';

export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
export const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || 'http://localhost:5002';
export const FEED_SERVICE_URL =
  process.env.FEED_SERVICE_URL || 'http://localhost:5003';
export const POSTS_SERVICE_URL =
  process.env.POSTS_SERVICE_URL || 'http://localhost:5004';
export const COMMENT_SERVICE_URL =
  process.env.COMMENT_SERVICE_URL || 'http://localhost:5005';
export const LIKE_SERVICE_URL =
  process.env.LIKE_SERVICE_URL || 'http://localhost:5006';
export const MESSAGE_SERVICE_URL =
  process.env.MESSAGE_SERVICE_URL || 'http://localhost:5007';
export const MEDIA_SERVICE_URL =
  process.env.MEDIA_SERVICE_URL || 'http://localhost:5008';
