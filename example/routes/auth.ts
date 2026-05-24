import { randomUUID } from 'crypto';
import { createRouter, String, Email, Optional, createSchema } from '../../src/index';
import { signToken, hashPassword, verifyPassword } from '../lib/auth';
import { authRequired } from '../middleware/auth';
import { ConflictError, UnauthorizedError, NotFoundError } from '../lib/errors';
import { Store } from '../lib/store';
import { requestLogger } from '../middleware/requestLogger';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'customer';
  createdAt: string;
  updatedAt: string;
}

export const userStore = new Store<User>();

const registerSchema = createSchema({
  email: Email(),
  name: String(),
  password: String(),
});

const loginSchema = createSchema({
  email: Email(),
  password: String(),
});

const router = createRouter({
  info: { title: 'Auth API', version: '1.0.0' },
});

router.post(
  '/register',
  {
    body: registerSchema,
    after: [requestLogger],
    meta: {
      summary: 'Register a new user',
      tags: ['auth'],
      responses: {
        '201': { description: 'User registered successfully' },
        '409': { description: 'Email already in use' },
      },
    },
  },
  (req, res) => {
    const existing = userStore.findWhere(u => u.email === req.body.email);
    if (existing.length > 0) throw new ConflictError('Email already registered');

    const now = new Date().toISOString();
    const user = userStore.create({
      id: randomUUID(),
      email: req.body.email,
      name: req.body.name,
      passwordHash: hashPassword(req.body.password),
      role: 'customer',
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({ sub: user.id, role: user.role });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }
);

router.post(
  '/login',
  {
    body: loginSchema,
    after: [requestLogger],
    meta: {
      summary: 'Login with email and password',
      tags: ['auth'],
      responses: {
        '200': { description: 'Login successful' },
        '401': { description: 'Invalid credentials' },
      },
    },
  },
  (req, res) => {
    const users = userStore.findWhere(u => u.email === req.body.email);
    if (users.length === 0) throw new UnauthorizedError('Invalid email or password');

    const user = users[0];
    if (!verifyPassword(req.body.password, user.passwordHash)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ sub: user.id, role: user.role });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }
);

router.get(
  '/me',
  {
    before: [authRequired],
    after: [requestLogger],
    meta: {
      summary: 'Get current user profile',
      tags: ['auth'],
      responses: {
        '200': { description: 'Current user profile' },
        '401': { description: 'Authentication required' },
      },
    },
  },
  (req, res) => {
    const user = userStore.find(req.user!.sub);
    if (!user) throw new NotFoundError('User');
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
);

export default router;
