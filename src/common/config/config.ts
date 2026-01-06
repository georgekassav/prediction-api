import dotenv from 'dotenv';
import path from 'path';

// Determine which .env file to load based on NODE_ENV
// Railway sets NODE_ENV and injects env vars directly, so .env files are only for local dev
const envFile = (() => {
  const env = process.env.NODE_ENV || 'development';

  // Map environment to file names
  const envFiles: Record<string, string> = {
    development: '.env.local',
    staging: '.env.staging',
    production: '.env.production',
  };

  return envFiles[env] || '.env.local';
})();

// Load environment-specific file first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // Load .env as fallback for any missing vars

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-me',

  // Helpers
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_STAGING: process.env.NODE_ENV === 'staging',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;
