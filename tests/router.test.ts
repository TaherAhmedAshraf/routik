import { describe, it, expect } from 'vitest';
import express from 'express';
import { z } from 'zod';
import { createRouter } from '../src/router';

describe('router integration', () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    return app;
  };

  it('registers a route with validation and returns spec', () => {
    const app = createTestApp();
    const router = createRouter({
      info: { title: 'Test API', version: '1.0.0' },
    });

    router.get('/users/:id', {
      params: z.object({ id: z.string() }),
      query: z.object({ expand: z.boolean().optional() }),
      meta: { summary: 'Get user', tags: ['users'] },
    }, (req, res) => {
      res.json({ user: req.params.id });
    });

    app.use(router.getRouter());

    const spec = router.getSpec() as any;

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.paths['/users/{id}']).toBeDefined();
    expect(spec.paths['/users/{id}'].get).toBeDefined();
    expect(spec.paths['/users/{id}'].get.summary).toBe('Get user');
    expect(spec.paths['/users/{id}'].get.tags).toContain('users');
  });

  it('registers POST route with body validation', () => {
    const app = createTestApp();
    const router = createRouter();

    router.post('/items', {
      body: z.object({
        name: z.string(),
        price: z.number(),
      }),
      meta: { summary: 'Create item' },
    }, (req, res) => {
      res.json({ created: req.body });
    });

    app.use(router.getRouter());

    const spec = router.getSpec() as any;

    expect(spec.paths['/items'].post).toBeDefined();
    expect(spec.paths['/items'].post.requestBody).toBeDefined();
    expect(spec.paths['/items'].post.requestBody.content['application/json']).toBeDefined();
  });

  it('supports global middleware', () => {
    const app = createTestApp();
    const router = createRouter();

    let globalMiddlewareCalled = false;

    router.useGlobal([(req, res, next) => {
      globalMiddlewareCalled = true;
      next();
    }]);

    router.get('/test', {
      meta: { summary: 'Test' },
    }, (req, res) => {
      res.json({ ok: true });
    });

    app.use(router.getRouter());

    expect(router.getSpec()).toBeDefined();
  });

  it('validates request params before handler', async () => {
    const app = createTestApp();
    const router = createRouter();

    router.get('/items/:id', {
      params: z.object({ id: z.string().uuid() }),
    }, (req, res) => {
      res.json({ id: req.params.id });
    });

    app.use(router.getRouter());

    const spec = router.getSpec() as any;
    expect(spec.paths['/items/{id}'].get.parameters).toBeDefined();
    const idParam = spec.paths['/items/{id}'].get.parameters.find((p: any) => p.name === 'id');
    expect(idParam).toBeDefined();
    expect(idParam.in).toBe('path');
  });
});