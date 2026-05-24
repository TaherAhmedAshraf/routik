import { randomUUID } from 'crypto';
import {
  createRouter,
  String,
  Email,
  Optional,
  Enum,
  createSchema,
} from '../../src/index';
import { userStore, User } from './auth';
import { hashPassword } from '../lib/auth';
import { authRequired, adminRequired } from '../middleware/auth';
import { requestLogger } from '../middleware/requestLogger';
import { NotFoundError } from '../lib/errors';
import { parsePagination, paginate } from '../lib/pagination';

const listUsersQuery = createSchema({
  page: Optional(String()),
  limit: Optional(String()),
  sort: Optional(String()),
  order: Optional(String()),
  role: Optional(String()),
  search: Optional(String()),
});

const updateUserSchema = createSchema({
  name: Optional(String()),
  email: Optional(Email()),
  role: Optional(Enum(['admin', 'customer'])),
  password: Optional(String()),
});

const router = createRouter({
  info: { title: 'Users Admin API', version: '1.0.0' },
});

router.useGlobal([authRequired, adminRequired, requestLogger]);

router.get(
  '/',
  {
    query: listUsersQuery,
    meta: {
      summary: 'List all users (admin)',
      tags: ['users'],
      responses: { '200': { description: 'Paginated list of users' } },
    },
  },
  (req, res) => {
    const pag = parsePagination(req.query as any);
    let users = userStore.all().map(({ passwordHash, ...u }) => u);

    const { search, role } = req.query as any;
    if (search) {
      const q = String(search).toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (role) {
      users = users.filter(u => u.role === role);
    }

    const result = paginate(users, pag, 'createdAt' as any);
    res.json(result);
  }
);

router.get(
  '/:id',
  {
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Get user by ID (admin)',
      tags: ['users'],
      responses: {
        '200': { description: 'User found' },
        '404': { description: 'User not found' },
      },
    },
  },
  (req, res) => {
    const user = userStore.find(req.params.id);
    if (!user) throw new NotFoundError('User', req.params.id);
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }
);

router.patch(
  '/:id',
  {
    params: createSchema({ id: String() }),
    body: updateUserSchema,
    meta: {
      summary: 'Update user (admin)',
      tags: ['users'],
      responses: {
        '200': { description: 'User updated' },
        '404': { description: 'User not found' },
      },
    },
  },
  (req, res) => {
    const updates: Partial<User> = { ...req.body, updatedAt: new Date().toISOString() };
    if (req.body.password) {
      updates.passwordHash = hashPassword(req.body.password);
      delete (updates as any).password;
    }
    const updated = userStore.update(req.params.id, updates);
    if (!updated) throw new NotFoundError('User', req.params.id);
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  }
);

router.delete(
  '/:id',
  {
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Delete user (admin)',
      tags: ['users'],
      responses: {
        '204': { description: 'User deleted' },
        '404': { description: 'User not found' },
      },
    },
  },
  (req, res) => {
    const deleted = userStore.delete(req.params.id);
    if (!deleted) throw new NotFoundError('User', req.params.id);
    res.status(204).send();
  }
);

export default router;
