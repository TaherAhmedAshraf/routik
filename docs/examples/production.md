# Production-Grade API

Full-featured backend demonstrating auth, RBAC, pagination, sub-routers, before/after hooks, and auto-generated OpenAPI docs with security schemes.

This example is in the [`example/`](https://github.com/example/routik/tree/main/example) directory.

## Features Demonstrated

| Feature | How |
|---------|-----|
| JWT Auth | `before: [authRequired]` per-route or `useGlobal()` per-router |
| Role-Based Access | `authRequired` + `adminRequired` middleware |
| Pagination & Filtering | Reusable `parsePagination()` + `paginate()` helpers |
| Before/After Hooks | Auth before validation, request logging after |
| Sub-Router Mounting | Users, Products, Orders as separate routers merged into one OpenAPI spec |
| Security Schemes | Bearer JWT configured in `createRouter()` |
| Custom Error Classes | `AppError`, `NotFoundError`, `UnauthorizedError`, etc. |
| Search & Filter | Query params for `?search=`, `?category=`, `?status=` |
| Stock Management | Order creation decrements inventory, cancellation restores it |

## Structure

```
example/
├── app.ts                  # Express entry: helmet, cors, logging, error handler
├── seed.ts                 # Seeds admin, 2 customers, 5 products, 2 orders
├── lib/
│   ├── errors.ts           # AppError base + NotFoundError, UnauthorizedError, etc.
│   ├── store.ts            # Generic in-memory repository (swap for SQL/Prisma)
│   ├── auth.ts             # JWT sign/verify + password hashing (Node crypto)
│   └── pagination.ts       # Pagination, sorting, filtering helpers
├── middleware/
│   ├── auth.ts             # authRequired, adminRequired middleware
│   ├── errorHandler.ts     # Catches AppError + validation errors
│   └── requestLogger.ts    # Request logging middleware
└── routes/
    ├── auth.ts             # POST /auth/register, POST /auth/login, GET /auth/me
    ├── users.ts            # Admin-only user CRUD with search
    ├── products.ts         # Public read, admin write, stock management
    └── orders.ts           # User-scoped orders with status workflow
```

## app.ts

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRouter } from 'routik';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const apiRouter = createRouter({
  info: {
    title: 'Enterprise E-Commerce API',
    version: '1.0.0',
    description: 'Production-grade API with auth, RBAC, and auto-generated docs'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Development' }],
  securitySchemes: [
    { id: 'bearerAuth', type: 'http', scheme: 'bearer' }
  ]
});

// Mount sub-routers
apiRouter.use('/users', usersRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/orders', ordersRouter);

app.use(apiRouter.getRouter());
apiRouter.mountDocs('/docs', app);
app.use(errorHandler);
```

## Auth Routes

```typescript
// Public routes
router.post('/register', {
  body: createSchema({ email: Email(), name: String(), password: String() }),
  meta: { summary: 'Register a new user', tags: ['auth'] }
}, (req, res) => {
  // req.body is validated - create user, return JWT
});

router.post('/login', {
  body: createSchema({ email: Email(), password: String() }),
  meta: { summary: 'Login', tags: ['auth'] }
}, (req, res) => {
  // Verify credentials, return JWT
});

// Protected route with before hook
router.get('/me', {
  before: [authRequired],       // Runs BEFORE validation
  after: [requestLogger],       // Runs AFTER validation, BEFORE handler
  meta: { summary: 'My profile', tags: ['auth'] }
}, (req, res) => {
  // req.user is set by authRequired middleware
  res.json({ id: req.user.sub, email, name, role });
});
```

## User Routes (Admin-Only)

Uses `useGlobal()` to apply auth + admin check to ALL routes:

```typescript
const router = createRouter({ info: { title: 'Users Admin API' } });

// All routes require admin auth
router.useGlobal([authRequired, adminRequired, requestLogger]);

router.get('/', {
  query: createSchema({ page: Optional(String()), search: Optional(String()), role: Optional(String()) }),
  meta: { summary: 'List all users (admin)', tags: ['users'] }
}, (req, res) => {
  const pag = parsePagination(req.query);
  const users = userStore.all().filter(bySearch(req.query.search)).filter(byRole(req.query.role));
  res.json(paginate(users, pag));
});
```

## Order Routes (Scoped to User)

```typescript
router.get('/', {
  before: [authRequired],
  query: createSchema({ page: Optional(String()), status: Optional(String()) }),
  meta: { summary: 'List my orders', tags: ['orders'] }
}, (req, res) => {
  // Only returns orders belonging to req.user.sub
  const orders = orderStore.findWhere(o => o.userId === req.user!.sub);
});
```

## Validation Schemas

```typescript
// Nested objects with deep nesting
const createOrderSchema = createSchema({
  items: Array(Obj({
    productId: String(),
    quantity: Positive()
  })),
  shippingAddress: {
    street: String(),
    city: String(),
    zip: String(),
    country: String()
  },
  notes: Optional(String())
});

// Union of literal values
const updateStatusSchema = createSchema({
  status: Union([
    Literal('confirmed'),
    Literal('shipped'),
    Literal('delivered'),
    Literal('cancelled')
  ])
});

// Record type for key-value maps
const preferencesSchema = createSchema({
  preferences: Record(String()),   // Record<string, string>
  scores: Record(Number())         // Record<string, number>
});

// Json type for arbitrary data
const metadataSchema = createSchema({
  metadata: Json()
});
```

## Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
  }
}
export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(404, id ? `${entity} '${id}' not found` : `${entity} not found`);
  }
}

// In route handlers - throw and they're caught by errorHandler
if (!user) throw new NotFoundError('User', req.params.id);

// Validation errors (from the package) are also caught
// They have: err.status === 400, err.errors = [{ path, message }]

// middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: err.message, errors: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Run It

```bash
# From the project root
npm run start

# Or directly
npx tsx example/app.ts
```

Test accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| alice@example.com | password123 | customer |
| bob@example.com | password123 | customer |

## Key Patterns

1. **useGlobal()** for router-scoped middleware (auth + admin on users router)
2. **before: [authRequired]** for per-route auth
3. **after: [requestLogger]** for logging after validation
4. **Throw AppError** in handlers, caught by global error handler
5. **Sub-routers** with `router.use('/path', subRouter)` merge OpenAPI specs
6. **Security schemes** in `createRouter()` config appear in Swagger UI
