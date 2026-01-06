import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { eq, or } from 'drizzle-orm';
import { db, users, User } from '../../db';
import { jwtConfig } from '../../common/config/jwt';
import { redis } from '../../common/config/redis';
import { hashPassword, comparePassword } from '../../common/utils/password';
import { TokenPair, JwtPayload, AppError } from '../../common/types';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

class AuthService {
  async createUser(email: string, username: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new AppError(409, 'User with this email or username already exists');
    }

    const passwordHash = await hashPassword(password);

    const result = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
      })
      .returning();

    return result[0];
  }

  async loginUser(email: string, password: string): Promise<TokenPair> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      throw new AppError(401, 'Invalid credentials');
    }

    const user = result[0];
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    return this.generateTokenPair(user);
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
    const userId = await redis.get(key);

    if (!userId) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Get user from database
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      // User was deleted, clean up the token
      await redis.del(key);
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Delete old refresh token (rotation)
    await redis.del(key);

    return this.generateTokenPair(result[0]);
  }

  async logoutUser(refreshToken: string, userId: string): Promise<void> {
    const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;

    // Verify the token belongs to this user
    const tokenUserId = await redis.get(key);
    if (tokenUserId && tokenUserId !== userId) {
      throw new AppError(403, 'Token does not belong to this user');
    }

    await redis.del(key);
  }

  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0] || null;
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessExpiresIn,
    });

    const refreshToken = uuidv4();
    const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;

    // Store refresh token in Redis with TTL
    await redis.set(key, user.id, 'EX', REFRESH_TOKEN_TTL);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
