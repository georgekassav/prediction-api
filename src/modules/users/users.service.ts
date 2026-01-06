import { eq, or, and, ne } from 'drizzle-orm';
import omit from 'lodash/omit';
import { db, users, User } from '../../db';
import { BaseService } from '../../common/base/base.service';
import { AppError, PaginationOptions, PaginatedResult } from '../../common/types';

// Public user data (excludes passwordHash)
export type PublicUser = Omit<User, 'passwordHash'>;

const toPublicUser = (user: User): PublicUser => omit(user, 'passwordHash');

class UsersService extends BaseService<typeof users, PublicUser> {
  constructor() {
    super(users);
  }

  async getAll(options: PaginationOptions = {}): Promise<PaginatedResult<PublicUser>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset),
      this.count(),
    ]);

    return {
      data: data.map(toPublicUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<PublicUser | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ? toPublicUser(result[0]) : null;
  }

  async getByIdOrFail(id: string): Promise<PublicUser> {
    const user = await this.getById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async updateUser(
    userId: string,
    updates: { email?: string; username?: string }
  ): Promise<PublicUser> {
    // Check for conflicts if email or username is being updated
    if (updates.email || updates.username) {
      const conditions = [];

      if (updates.email) {
        conditions.push(eq(users.email, updates.email));
      }
      if (updates.username) {
        conditions.push(eq(users.username, updates.username));
      }

      const conflicts = await db
        .select({ id: users.id })
        .from(users)
        .where(and(ne(users.id, userId), or(...conditions)))
        .limit(1);

      if (conflicts.length > 0) {
        throw new AppError(409, 'Email or username already taken');
      }
    }

    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      throw new AppError(404, 'User not found');
    }

    return toPublicUser(result[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findByUsername(username: string): Promise<PublicUser | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ? toPublicUser(result[0]) : null;
  }
}

export const usersService = new UsersService();
