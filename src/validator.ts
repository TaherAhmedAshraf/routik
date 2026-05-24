import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError, ZodObject } from 'zod';
import { RouteSchema, NormalizedRouteSchema, isShorthandObject, isTypeWrapper } from './types';
import { maybeParseShorthand } from './shorthand';
import { maybeParseType } from './infer';

interface ValidationTarget {
  schema: ZodType<any>;
  source: 'params' | 'query' | 'body';
}

export interface ValidationError extends Error {
  status?: number;
  errors?: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
}

function formatZodError(error: ZodError): ValidationError {
  const err: ValidationError = new Error('Validation failed');
  err.status = 400;
  err.errors = error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));
  return err;
}

function normalizeToZod(value: any): ZodType<any> | undefined {
  if (!value) return undefined;

  if (value instanceof ZodType) {
    return value as ZodType<any>;
  }

  if (isShorthandObject(value)) {
    return maybeParseShorthand(value) as ZodType<any>;
  }

  if (isTypeWrapper(value)) {
    return value._zodMeta as ZodType<any>;
  }

  const typeResult = maybeParseType(value);
  if (typeResult) {
    return typeResult;
  }

  return undefined;
}

export function normalizeSchema(schema: RouteSchema): NormalizedRouteSchema {
  return {
    params: normalizeToZod(schema.params),
    query: normalizeToZod(schema.query),
    body: normalizeToZod(schema.body),
    meta: schema.meta,
    before: schema.before,
    after: schema.after,
  };
}

export function createValidatorMiddleware(routeSchema: RouteSchema) {
  const normalized = normalizeSchema(routeSchema);
  const validations: ValidationTarget[] = [];

  if (normalized.params) {
    validations.push({ schema: normalized.params, source: 'params' });
  }
  if (normalized.query) {
    validations.push({ schema: normalized.query, source: 'query' });
  }
  if (normalized.body) {
    validations.push({ schema: normalized.body, source: 'body' });
  }

  return (req: Request, res: Response, next: NextFunction) => {
    for (const validation of validations) {
      const result = validation.schema.safeParse(req[validation.source]);
      if (!result.success) {
        return next(formatZodError(result.error));
      }
      if (validation.source === 'body') {
        (req as any).validatedBody = result.data;
      } else if (validation.source === 'query') {
        (req as any).validatedQuery = result.data;
      } else if (validation.source === 'params') {
        (req as any).validatedParams = result.data;
      }
    }
    next();
  };
}