# Middlewares

Middleware hooks let you run code before validation (auth, rate limiting) or after validation (logging, audit).

## Global Middleware

Apply to ALL routes on a router via `useGlobal()`:

```typescript
const adminRouter = createRouter();
adminRouter.useGlobal([authRequired, adminRequired, requestLogger]);

// These routes ALL run authRequired → adminRequired → requestLogger first
adminRouter.get('/users', { meta: { summary: 'List users' } }, handler);
adminRouter.delete('/users/:id', { meta: { summary: 'Delete user' } }, handler);
```

## Before Hooks

Run BEFORE validation — useful for auth/fail-fast:

```typescript
router.post('/admin/users', {
  body: { name: 'string' },
  before: [authRequired, adminRequired]   // Auth runs BEFORE validation
}, handler);
```

### Auth Middleware Pattern

```typescript
// middleware/auth.ts
export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}

// Route
router.get('/me', {
  before: [authRequired],
  meta: { summary: 'My profile', tags: ['auth'] }
}, (req, res) => {
  // req.user is set
  res.json({ id: req.user.sub, email: req.user.email });
});
```

## After Hooks

Run AFTER validation but BEFORE handler — useful for logging, audit, metrics:

```typescript
router.post('/users', {
  body: { name: 'string' },
  after: [auditLogger],
  meta: { summary: 'Create user' }
}, handler);
```

### Request Logger Pattern

```typescript
// middleware/requestLogger.ts
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}
```

## Execution Order

```
Global → Before → Validation → After → Handler
```

If any middleware calls `next(err)`, subsequent middleware is skipped.

## When to Use Each

| Hook | Use Case |
|------|----------|
| `Global` | Auth, logging, rate limiting — applied to every route |
| `Before` | Auth checks that should fail fast, before parsing body |
| `After` | Logging validated data, audit trails, response timing |
