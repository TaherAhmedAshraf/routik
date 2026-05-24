import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/auth';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function adminRequired(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'admin') return next(new ForbiddenError());
  next();
}
