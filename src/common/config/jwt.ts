import { config } from './config';

// Expiration times in seconds
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export const jwtConfig = {
  secret: config.JWT_SECRET,
  accessExpiresIn: ACCESS_TOKEN_EXPIRY,
  refreshExpiresIn: REFRESH_TOKEN_EXPIRY,
};
