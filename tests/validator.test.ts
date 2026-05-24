import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createValidatorMiddleware } from '../src/validator';

describe('validator', () => {
  const mockRequest = (overrides: any = {}) => ({
    params: {},
    query: {},
    body: {},
    ...overrides,
  }) as any;

  const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    return res;
  };

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes validation with valid params', () => {
    const schema = {
      params: z.object({ id: z.string() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ params: { id: '123' } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid params', () => {
    const schema = {
      params: z.object({ id: z.string().uuid() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ params: { id: 'not-a-uuid' } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        status: 400,
        errors: expect.arrayContaining([
          expect.objectContaining({ path: 'id' }),
        ]),
      })
    );
  });

  it('passes validation with valid query', () => {
    const schema = {
      query: z.object({ page: z.string().optional() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ query: { page: '1' } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 for invalid query', () => {
    const schema = {
      query: z.object({ limit: z.number() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ query: { limit: 'not-a-number' } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
      })
    );
  });

  it('passes validation with valid body', () => {
    const schema = {
      body: z.object({ name: z.string(), age: z.number() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ body: { name: 'John', age: 30 } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 for invalid body', () => {
    const schema = {
      body: z.object({ name: z.string(), age: z.number() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({ body: { name: 'John', age: 'not-a-number' } });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
      })
    );
  });

  it('validates all three sources when all schemas present', () => {
    const schema = {
      params: z.object({ id: z.string() }),
      query: z.object({ expand: z.boolean() }),
      body: z.object({ name: z.string() }),
    };
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest({
      params: { id: '123' },
      query: { expand: true },
      body: { name: 'John' },
    });
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('does nothing when no schemas provided', () => {
    const schema = {};
    const middleware = createValidatorMiddleware(schema);

    const req = mockRequest();
    const res = mockResponse();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});