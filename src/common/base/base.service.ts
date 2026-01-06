import { eq, sql, SQL } from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { db } from '../../db';
import { AppError, PaginationOptions, PaginatedResult } from '../types';

export abstract class BaseService<
  TTable extends PgTableWithColumns<any>,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert']
> {
  constructor(protected readonly table: TTable) {}

  async getAll(options: PaginationOptions = {}): Promise<PaginatedResult<TSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const data = await db.select().from(this.table).limit(limit).offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(this.table);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: data as unknown as TSelect[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<TSelect | null> {
    const idColumn = (this.table as any).id;
    const result = await db.select().from(this.table).where(eq(idColumn, id)).limit(1);

    return (result[0] as unknown as TSelect) || null;
  }

  async getByIdOrFail(id: string): Promise<TSelect> {
    const entity = await this.getById(id);

    if (!entity) {
      throw new AppError(404, 'Resource not found');
    }

    return entity;
  }

  async create(data: TInsert): Promise<TSelect> {
    const result = (await db
      .insert(this.table)
      .values(data as any)
      .returning()) as unknown as TSelect[];

    return result[0];
  }

  async updateById(id: string, data: Partial<TInsert>): Promise<TSelect> {
    const idColumn = (this.table as any).id;
    const updatedAtColumn = (this.table as any).updatedAt;

    const updateData = updatedAtColumn ? { ...data, updatedAt: new Date() } : data;

    const result = (await db
      .update(this.table)
      .set(updateData as any)
      .where(eq(idColumn, id))
      .returning()) as unknown as TSelect[];

    if (result.length === 0) {
      throw new AppError(404, 'Resource not found');
    }

    return result[0];
  }

  async deleteById(id: string): Promise<void> {
    const idColumn = (this.table as any).id;
    const result = (await db
      .delete(this.table)
      .where(eq(idColumn, id))
      .returning({ id: idColumn })) as unknown as { id: string }[];

    if (result.length === 0) {
      throw new AppError(404, 'Resource not found');
    }
  }

  async exists(id: string): Promise<boolean> {
    const entity = await this.getById(id);
    return entity !== null;
  }

  async count(where?: SQL): Promise<number> {
    const baseQuery = db.select({ count: sql<number>`count(*)` }).from(this.table);
    const result = where ? await baseQuery.where(where) : await baseQuery;
    return Number(result[0]?.count || 0);
  }

  async findOne(where: SQL): Promise<TSelect | null> {
    const result = await db.select().from(this.table).where(where).limit(1);

    return (result[0] as unknown as TSelect) || null;
  }

  async findMany(where: SQL, options: PaginationOptions = {}): Promise<PaginatedResult<TSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const data = await db.select().from(this.table).where(where).limit(limit).offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(where);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: data as unknown as TSelect[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
