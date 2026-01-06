import { Request, Response, NextFunction } from 'express';
import { BaseService } from './base.service';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

export abstract class BaseController<TTable extends PgTableWithColumns<any>> {
  constructor(protected readonly service: BaseService<TTable>) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.service.getAll({ page, limit });

      res.json({
        status: 'success',
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const entity = await this.service.getByIdOrFail(id);

      res.json({
        status: 'success',
        data: entity,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = await this.service.create(req.body);

      res.status(201).json({
        status: 'success',
        data: entity,
      });
    } catch (err) {
      next(err);
    }
  };

  updateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const entity = await this.service.updateById(id, req.body);

      res.json({
        status: 'success',
        data: entity,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.deleteById(id);

      res.json({
        status: 'success',
        message: 'Deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}
