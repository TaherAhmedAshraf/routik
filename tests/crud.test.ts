import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { createRouter } from '../src/router';

describe('CRUD operations', () => {
  const app = express();
  app.use(express.json());

  interface User {
    id: string;
    name: string;
    email: string;
    age?: number;
  }

  const users: Map<string, User> = new Map();

  const userSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  });

  const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    age: z.number().int().positive().optional(),
  });

  const router = createRouter({
    info: { title: 'Test API', version: '1.0.0' },
  });

  // Mount router BEFORE error handler
  app.use(router.getRouter());

  // Error handler must come AFTER router to catch errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message, errors: err.errors });
    }
    next(err);
  });

  router.get('/users', {
    query: z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    }),
    meta: { summary: 'List users', tags: ['users'] },
  }, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const allUsers = Array.from(users.values());
    const start = (page - 1) * limit;
    res.json({ data: allUsers.slice(start, start + limit), total: allUsers.length });
  });

  router.get('/users/:id', {
    params: z.object({ id: z.string().uuid() }),
    meta: { summary: 'Get user', tags: ['users'] },
  }, (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  });

  router.post('/users', {
    body: userSchema,
    meta: { summary: 'Create user', tags: ['users'] },
  }, (req, res) => {
    const id = 'test-uuid-1234';
    const user: User = { id, ...req.body };
    users.set(id, user);
    res.status(201).json(user);
  });

  router.put('/users/:id', {
    params: z.object({ id: z.string().uuid() }),
    body: updateUserSchema,
    meta: { summary: 'Update user', tags: ['users'] },
  }, (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const updated = { ...user, ...req.body };
    users.set(req.params.id, updated);
    res.json(updated);
  });

  router.patch('/users/:id', {
    params: z.object({ id: z.string().uuid() }),
    body: updateUserSchema.partial(),
    meta: { summary: 'Patch user', tags: ['users'] },
  }, (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const updated = { ...user, ...req.body };
    users.set(req.params.id, updated);
    res.json(updated);
  });

  router.delete('/users/:id', {
    params: z.object({ id: z.string().uuid() }),
    meta: { summary: 'Delete user', tags: ['users'] },
  }, (req, res) => {
    if (!users.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
    users.delete(req.params.id);
    res.status(204).send();
  });

  app.use(router.getRouter());

  beforeEach(() => {
    users.clear();
  });

  describe('POST /users', () => {
    it('creates a new user', async () => {
      const res = await request(app)
        .post('/users')
        .send({ name: 'John', email: 'john@example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'John', email: 'john@example.com' });
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/users')
        .send({ name: 'John', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/users')
        .send({ email: 'john@example.com' });

      expect(res.status).toBe(400);
    });

    it('creates user with optional age', async () => {
      const res = await request(app)
        .post('/users')
        .send({ name: 'Jane', email: 'jane@example.com', age: 25 });

      expect(res.status).toBe(201);
      expect(res.body.age).toBe(25);
    });
  });

  describe('GET /users', () => {
    it('returns empty list when no users', async () => {
      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns paginated users', async () => {
      users.set('1', { id: '1', name: 'User1', email: 'u1@test.com' });
      users.set('2', { id: '2', name: 'User2', email: 'u2@test.com' });

      const res = await request(app).get('/users?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.total).toBe(2);
    });
  });

  describe('GET /users/:id', () => {
    it('returns user by id', async () => {
      users.set('550e8400-e29b-41d4-a716-446655440000', { id: '550e8400-e29b-41d4-a716-446655440000', name: 'John', email: 'john@test.com' });

      const res = await request(app)
        .get('/users/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('John');
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/users/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid uuid format', async () => {
      const res = await request(app).get('/users/not-a-uuid');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /users/:id', () => {
    it('updates a user', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      users.set(id, { id, name: 'John', email: 'john@test.com' });

      const res = await request(app)
        .put(`/users/${id}`)
        .send({ name: 'Jane', email: 'jane@test.com' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'Jane', email: 'jane@test.com' });
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/users/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'Jane' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('partially updates a user', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      users.set(id, { id, name: 'John', email: 'john@test.com' });

      const res = await request(app)
        .patch(`/users/${id}`)
        .send({ name: 'Jane' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Jane');
      expect(res.body.email).toBe('john@test.com');
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes a user', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      users.set(id, { id, name: 'John', email: 'john@test.com' });

      const res = await request(app).delete(`/users/${id}`);

      expect(res.status).toBe(204);
      expect(users.has(id)).toBe(false);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/users/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(404);
    });
  });
});