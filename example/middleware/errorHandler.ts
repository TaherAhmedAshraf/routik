import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if ((err as any).status === 400) {
    res.status(400).json({
      error: err.message,
      errors: (err as any).errors,
    });
    return;
  }

  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
}
