import { config } from 'dotenv';
import fs from 'fs';

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;

if (fs.existsSync(envFile)) {
  config({ path: envFile });
} else {
  throw new Error(`❌ Missing environment file: ${envFile}`);
}

export const PORT = process.env.PORT || '5001';
export const NODE_ENV = process.env.NODE_ENV || 'development';
