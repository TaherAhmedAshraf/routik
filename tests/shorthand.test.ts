import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import express from 'express';
import request from 'supertest';
import { createRouter } from '../src/router';
import { parseShorthand, parseShorthandObject } from '../src/shorthand';
import { Type, String, Number, Boolean, Email, Url, Uuid, Int, Positive, Optional, Nullable, Array, Enum, Obj, Record, Json, Any, Literal, createSchema } from '../src/infer';

describe('shorthand parser', () => {
  describe('parseShorthand', () => {
    it('parses basic string type', () => {
      const schema = parseShorthand('string');
      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
    });

    it('parses string with email validation', () => {
      const schema = parseShorthand('string.email');
      expect(schema.safeParse('test@example.com').success).toBe(true);
      expect(schema.safeParse('not-an-email').success).toBe(false);
    });

    it('parses string with uuid validation', () => {
      const schema = parseShorthand('string.uuid');
      expect(schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      expect(schema.safeParse('not-a-uuid').success).toBe(false);
    });

    it('parses string with url validation', () => {
      const schema = parseShorthand('string.url');
      expect(schema.safeParse('https://example.com').success).toBe(true);
      expect(schema.safeParse('not-a-url').success).toBe(false);
    });

    it('parses string with min constraint', () => {
      const schema = parseShorthand('string.min(3)');
      expect(schema.safeParse('abc').success).toBe(true);
      expect(schema.safeParse('ab').success).toBe(false);
    });

    it('parses string with max constraint', () => {
      const schema = parseShorthand('string.max(5)');
      expect(schema.safeParse('abcde').success).toBe(true);
      expect(schema.safeParse('abcdef').success).toBe(false);
    });

    it('parses optional string', () => {
      const schema = parseShorthand('string?');
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it('parses nullable string', () => {
      const schema = parseShorthand('string!');
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(null).success).toBe(true);
    });

    it('parses string with default value', () => {
      const schema = parseShorthand('string.default("hello")');
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('hello');
    });

    it('parses basic number type', () => {
      const schema = parseShorthand('number');
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse('not-a-number').success).toBe(false);
    });

    it('parses number with min constraint', () => {
      const schema = parseShorthand('number.min(5)');
      expect(schema.safeParse(10).success).toBe(true);
      expect(schema.safeParse(3).success).toBe(false);
    });

    it('parses number with max constraint', () => {
      const schema = parseShorthand('number.max(100)');
      expect(schema.safeParse(50).success).toBe(true);
      expect(schema.safeParse(101).success).toBe(false);
    });

    it('parses positive number', () => {
      const schema = parseShorthand('number.positive()');
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(false);
    });

    it('parses negative number', () => {
      const schema = parseShorthand('number.negative()');
      expect(schema.safeParse(-1).success).toBe(true);
      expect(schema.safeParse(1).success).toBe(false);
    });

    it('parses integer', () => {
      const schema = parseShorthand('number.int()');
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(3.14).success).toBe(false);
    });

    it('parses boolean type', () => {
      const schema = parseShorthand('boolean');
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
    });

    it('parses date type', () => {
      const schema = parseShorthand('date');
      const now = new Date();
      expect(schema.safeParse(now).success).toBe(true);
      expect(schema.safeParse('not-a-date').success).toBe(false);
    });

    it('parses array type', () => {
      const schema = parseShorthand('string[]');
      expect(schema.safeParse(['a', 'b', 'c']).success).toBe(true);
      expect(schema.safeParse('not-an-array').success).toBe(false);
    });

    it('parses optional with default', () => {
      const schema = parseShorthand('string.default("default_name")');
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('default_name');
    });
  });

  describe('parseShorthandObject', () => {
    it('parses simple object', () => {
      const schema = parseShorthandObject({
        name: 'string',
        age: 'number',
      });
      const result = schema.safeParse({ name: 'John', age: 30 });
      expect(result.success).toBe(true);
    });

    it('parses nested object', () => {
      const schema = parseShorthandObject({
        name: 'string',
        address: {
          city: 'string',
          zip: 'string',
        },
      });
      const result = schema.safeParse({
        name: 'John',
        address: { city: 'NYC', zip: '10001' },
      });
      expect(result.success).toBe(true);
    });

    it('parses object with optional fields', () => {
      const schema = parseShorthandObject({
        name: 'string',
        age: 'number?',
      });
      expect(schema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
    });

    it('parses object with email validation', () => {
      const schema = parseShorthandObject({
        email: 'string.email',
      });
      expect(schema.safeParse({ email: 'test@example.com' }).success).toBe(true);
      expect(schema.safeParse({ email: 'invalid' }).success).toBe(false);
    });
  });
});

describe('infer (Type builder)', () => {
  describe('basic types', () => {
    it('creates string schema', () => {
      const schema = createSchema({ name: String() });
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse({ name: 123 }).success).toBe(false);
    });

    it('creates email schema', () => {
      const schema = createSchema({ email: Email() });
      expect(schema.safeParse({ email: 'test@example.com' }).success).toBe(true);
      expect(schema.safeParse({ email: 'invalid' }).success).toBe(false);
    });

    it('creates url schema', () => {
      const schema = createSchema({ url: Url() });
      expect(schema.safeParse({ url: 'https://example.com' }).success).toBe(true);
      expect(schema.safeParse({ url: 'not-a-url' }).success).toBe(false);
    });

    it('creates uuid schema', () => {
      const schema = createSchema({ id: Uuid() });
      expect(schema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true);
      expect(schema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
    });

    it('creates number schema with constraints', () => {
      const schema = createSchema({ age: Int(0, 150) });
      expect(schema.safeParse({ age: 25 }).success).toBe(true);
      expect(schema.safeParse({ age: -1 }).success).toBe(false);
      expect(schema.safeParse({ age: 200 }).success).toBe(false);
    });

    it('creates positive number schema', () => {
      const schema = createSchema({ value: Positive() });
      expect(schema.safeParse({ value: 10 }).success).toBe(true);
      expect(schema.safeParse({ value: -5 }).success).toBe(false);
    });

    it('creates boolean schema', () => {
      const schema = createSchema({ active: Boolean() });
      expect(schema.safeParse({ active: true }).success).toBe(true);
      expect(schema.safeParse({ active: 'yes' }).success).toBe(false);
    });

    it('creates enum schema', () => {
      const schema = createSchema({ status: Enum(['active', 'inactive', 'pending']) });
      expect(schema.safeParse({ status: 'active' }).success).toBe(true);
      expect(schema.safeParse({ status: 'unknown' }).success).toBe(false);
    });

    it('creates optional field', () => {
      const schema = createSchema({
        name: String(),
        age: Optional(Int()),
      });
      expect(schema.safeParse({ name: 'John', age: 25 }).success).toBe(true);
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
    });

    it('creates nullable field', () => {
      const schema = createSchema({ name: Nullable(String()) });
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse({ name: null }).success).toBe(true);
      expect(schema.safeParse({ name: 123 }).success).toBe(false);
    });

    it('creates array field', () => {
      const schema = createSchema({ tags: Array(String()) });
      expect(schema.safeParse({ tags: ['a', 'b'] }).success).toBe(true);
      expect(schema.safeParse({ tags: 'not-an-array' }).success).toBe(false);
    });

    it('creates nested object', () => {
      const schema = createSchema({
        name: String(),
        profile: Obj({
          bio: String(),
          age: Int(0, 150),
        }),
      });
      expect(schema.safeParse({
        name: 'John',
        profile: { bio: 'Developer', age: 30 },
      }).success).toBe(true);

      expect(schema.safeParse({
        name: 'John',
        profile: { bio: 'Developer', age: 'not-a-number' },
      }).success).toBe(false);
    });
  });
});

describe('integration: shorthand in router', () => {
  const createApp = () => {
    const app = express();
    app.use(express.json());
    return app;
  };

  const withErrorHandler = (app: express.Application) => {
    app.use((err: any, req: any, res: any, next: any) => {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message, errors: err.errors });
      }
      next(err);
    });
    return app;
  };

  it('uses shorthand string for body validation', async () => {
    const app = createApp();
    const router = createRouter();

    router.post('/users', {
      body: {
        name: 'string.min(1)',
        email: 'string.email',
        age: 'number?',
      },
      meta: { summary: 'Create user', tags: ['users'] },
    }, (req, res) => {
      res.status(201).json({ created: req.body });
    });

    app.use(router.getRouter());

    const res = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.created.name).toBe('John');
  });

  it('returns 400 for invalid shorthand validation', async () => {
    const app = createApp();
    const router = createRouter();

    router.post('/users', {
      body: {
        name: 'string.min(1)',
        email: 'string.email',
      },
      meta: { summary: 'Create user' },
    }, (req, res) => {
      res.status(201).json({ created: req.body });
    });

    app.use(router.getRouter());
    withErrorHandler(app);

    const res = await request(app)
      .post('/users')
      .send({ name: '', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('uses Type builder for body validation', async () => {
    const app = createApp();
    const router = createRouter();

    router.post('/products', {
      body: createSchema({
        name: String(),
        price: Number(0),
        tags: Optional(Array(String())),
      }),
      meta: { summary: 'Create product' },
    }, (req, res) => {
      res.status(201).json({ created: req.body });
    });

    app.use(router.getRouter());

    const res = await request(app)
      .post('/products')
      .send({ name: 'Widget', price: 29.99, tags: ['new', 'sale'] });

    expect(res.status).toBe(201);
    expect(res.body.created.name).toBe('Widget');
    expect(res.body.created.price).toBe(29.99);
  });

  it('uses Type builder with enum', async () => {
    const app = createApp();
    const router = createRouter();

    router.post('/orders', {
      body: createSchema({
        status: Enum(['pending', 'processing', 'shipped', 'delivered']),
      }),
      meta: { summary: 'Create order' },
    }, (req, res) => {
      res.status(201).json({ created: req.body });
    });

    app.use(router.getRouter());

    const res = await request(app)
      .post('/orders')
      .send({ status: 'pending' });

    expect(res.status).toBe(201);

    const invalidRes = await request(app)
      .post('/orders')
      .send({ status: 'invalid' });

    expect(invalidRes.status).toBe(400);
  });

  it('generates OpenAPI spec with shorthand schema', () => {
    const app = express();
    app.use(express.json());
    const router = createRouter({ info: { title: 'Test API' } });

    router.get('/search', {
      query: {
        q: 'string',
        limit: 'number?',
      },
      meta: { summary: 'Search', tags: ['search'] },
    }, (req, res) => {
      res.json([]);
    });

    app.use(router.getRouter());

    const spec = router.getSpec() as any;
    expect(spec.paths['/search']).toBeDefined();
    expect(spec.paths['/search'].get.parameters).toBeDefined();
  });

  it('generates OpenAPI spec with Type builder schema', () => {
    const app = express();
    app.use(express.json());
    const router = createRouter({ info: { title: 'Test API' } });

    router.post('/items', {
      body: Obj({
        name: String(),
        quantity: Int(1),
      }),
      meta: { summary: 'Create item', tags: ['items'] },
    }, (req, res) => {
      res.status(201).json(req.body);
    });

    app.use(router.getRouter());

    const spec = router.getSpec() as any;
    expect(spec.paths['/items']).toBeDefined();
    expect(spec.paths['/items'].post.requestBody).toBeDefined();
  });
});

describe('new features: deep nesting, arrays, JSON, Record', () => {
  describe('deep nesting with createSchema', () => {
    it('supports deeply nested objects inline', () => {
      const schema = createSchema({
        user: {
          name: String(),
          address: {
            city: String(),
            zip: String()
          }
        }
      });

      const validData = {
        user: {
          name: 'John',
          address: {
            city: 'NYC',
            zip: '10001'
          }
        }
      };

      const invalidData = {
        user: {
          name: 'John',
          address: {
            city: 123,
            zip: '10001'
          }
        }
      };

      expect(schema.safeParse(validData).success).toBe(true);
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('supports three levels of nesting', () => {
      const schema = createSchema({
        company: {
          name: String(),
          departments: {
            engineering: {
              head: String(),
              size: Number()
            }
          }
        }
      });

      const validData = {
        company: {
          name: 'Acme',
          departments: {
            engineering: {
              head: 'Alice',
              size: 50
            }
          }
        }
      };

      expect(schema.safeParse(validData).success).toBe(true);
    });

    it('supports optional nested fields', () => {
      const schema = createSchema({
        user: {
          name: String(),
          profile: {
            bio: Optional(String()),
            age: Number()
          }
        }
      });

      expect(schema.safeParse({
        user: { name: 'John', profile: { bio: 'dev', age: 30 } }
      }).success).toBe(true);

      expect(schema.safeParse({
        user: { name: 'John', profile: { age: 30 } }
      }).success).toBe(true);
    });
  });

  describe('arrays of objects', () => {
    it('supports inline array of objects with shorthand', () => {
      const schema = createSchema({
        items: [{
          id: String(),
          quantity: Number()
        }]
      });

      const validData = {
        items: [
          { id: 'item1', quantity: 1 },
          { id: 'item2', quantity: 2 }
        ]
      };

      const invalidData = {
        items: [
          { id: 'item1', quantity: 'not-a-number' }
        ]
      };

      expect(schema.safeParse(validData).success).toBe(true);
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('supports array of objects with complex nesting', () => {
      const schema = createSchema({
        orders: [{
          id: String(),
          customer: {
            name: String(),
            email: Email()
          },
          items: [{
            name: String(),
            price: Number()
          }]
        }]
      });

      const validData = {
        orders: [{
          id: 'order1',
          customer: { name: 'John', email: 'john@example.com' },
          items: [{ name: 'Widget', price: 9.99 }]
        }]
      };

      expect(schema.safeParse(validData).success).toBe(true);
    });
  });

  describe('JSON type', () => {
    it('accepts arbitrary JSON objects', () => {
      const schema = createSchema({
        metadata: Json()
      });

      expect(schema.safeParse({
        metadata: { custom: 'data', nested: { deep: true } }
      }).success).toBe(true);

      expect(schema.safeParse({
        metadata: { arr: [1, 2, 3] }
      }).success).toBe(true);
    });

    it('rejects non-objects', () => {
      const schema = createSchema({
        metadata: Json()
      });

      expect(schema.safeParse({ metadata: 'string' }).success).toBe(false);
      expect(schema.safeParse({ metadata: 123 }).success).toBe(false);
    });
  });

  describe('Record type', () => {
    it('creates key-value map with string keys', () => {
      const schema = createSchema({
        scores: Record(Number())
      });

      expect(schema.safeParse({
        scores: { alice: 100, bob: 95 }
      }).success).toBe(true);

      expect(schema.safeParse({
        scores: { alice: 'high' }
      }).success).toBe(false);
    });

    it('accepts empty records', () => {
      const schema = createSchema({
        metadata: Record(String())
      });

      expect(schema.safeParse({ metadata: {} }).success).toBe(true);
    });
  });

  describe('Any, Never, Void, Undefined types', () => {
    it('Any accepts anything', () => {
      const schema = createSchema({
        data: Any()
      });

      expect(schema.safeParse({ data: 'anything' }).success).toBe(true);
      expect(schema.safeParse({ data: 123 }).success).toBe(true);
      expect(schema.safeParse({ data: { nested: true } }).success).toBe(true);
    });

    it('Literal works correctly', () => {
      const schema = createSchema({
        status: Literal('active')
      });

      expect(schema.safeParse({ status: 'active' }).success).toBe(true);
      expect(schema.safeParse({ status: 'inactive' }).success).toBe(false);
    });

    it('Literal with number', () => {
      const schema = createSchema({
        type: Literal(1)
      });

      expect(schema.safeParse({ type: 1 }).success).toBe(true);
      expect(schema.safeParse({ type: 2 }).success).toBe(false);
    });
  });

  describe('integration with router', () => {
    it('handles deeply nested request body', async () => {
      const app = express();
      app.use(express.json());
      const router = createRouter();

      router.post('/companies', {
        body: createSchema({
          company: {
            name: String(),
            departments: {
              engineering: {
                head: String(),
                teams: [{
                  name: String(),
                  lead: String()
                }]
              }
            }
          }
        }),
        meta: { summary: 'Create company' },
      }, (req, res) => {
        res.status(201).json({ success: true });
      });

      app.use(router.getRouter());

      const res = await request(app)
        .post('/companies')
        .send({
          company: {
            name: 'Acme',
            departments: {
              engineering: {
                head: 'Alice',
                teams: [
                  { name: 'Backend', lead: 'Bob' }
                ]
              }
            }
          }
        });

      expect(res.status).toBe(201);
    });

    it('handles array of objects in request body', async () => {
      const app = express();
      app.use(express.json());
      const router = createRouter();

      router.post('/orders', {
        body: createSchema({
          items: [{
            id: String(),
            quantity: Number()
          }]
        }),
        meta: { summary: 'Create order' },
      }, (req, res) => {
        res.status(201).json({ created: true });
      });

      app.use(router.getRouter());

      const res = await request(app)
        .post('/orders')
        .send({
          items: [
            { id: 'item1', quantity: 2 },
            { id: 'item2', quantity: 1 }
          ]
        });

      expect(res.status).toBe(201);
    });

    it('handles JSON type for flexible metadata', async () => {
      const app = express();
      app.use(express.json());
      const router = createRouter();

      router.post('/configs', {
        body: createSchema({
          name: String(),
          settings: Json()
        }),
        meta: { summary: 'Create config' },
      }, (req, res) => {
        res.status(201).json({ created: true });
      });

      app.use(router.getRouter());

      const res = await request(app)
        .post('/configs')
        .send({
          name: 'my-config',
          settings: { theme: 'dark', notifications: { email: true } }
        });

      expect(res.status).toBe(201);
    });
  });
});