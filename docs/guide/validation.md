# Validation

Request data is validated automatically based on your schema definitions.

## How It Works

```typescript
router.post('/users', {
  body: { name: 'string.min(1)', email: 'string.email' }
}, (req, res) => {
  // req.body is ALREADY validated when this runs
  res.json({ id: '1', ...req.body });
});
```

If validation fails, the handler is NOT called. A 400 error is passed to Express `next()`.

## Three Ways to Define Schemas

### 1. Type Builder API (Recommended)

```typescript
import { createSchema, String, Email, Optional, Number } from 'routik';

router.post('/users', {
  body: createSchema({
    name: String(1, 100),
    email: Email(),
    age: Optional(Number(0, 150))
  })
}, handler);
```

### 2. Shorthand Strings

```typescript
router.post('/users', {
  body: {
    name: 'string.min(1)',
    email: 'string.email',
    age: 'number?'
  }
}, handler);
```

### 3. Raw Zod

```typescript
import { z } from 'zod';

router.post('/users', {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email()
  })
}, handler);
```

## Validation Targets

```typescript
router.get('/users/:id', {
  params: createSchema({ id: String() }),    // req.params
  query: createSchema({                       // req.query
    page: Optional(String()),
    limit: Optional(String())
  }),
  meta: { summary: 'Get user' }
}, handler);
```

All three targets are validated independently. If any fails, the handler is skipped.

## Error Response

Invalid requests return a 400 error:

```json
{
  "error": "Validation failed",
  "errors": [
    { "path": "email", "message": "Invalid email", "code": "invalid_string" },
    { "path": "name", "message": "String must contain at least 1 character(s)", "code": "too_small" }
  ]
}
```

## Error Handler

Add middleware after your routes to handle validation errors:

```typescript
app.use(router.getRouter());

app.use((err, req, res, next) => {
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message,
      errors: err.errors
    });
  }
  next(err);
});
```

## Custom Error Classes

For business logic errors, use custom error classes:

```typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, `${entity} not found`);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}
```

Throw them in handlers:

```typescript
router.get('/users/:id', {
  params: createSchema({ id: String() }),
  meta: { summary: 'Get user' }
}, (req, res) => {
  const user = userStore.find(req.params.id);
  if (!user) throw new NotFoundError('User');
  res.json(user);
});
```

Catch with a global error handler:

```typescript
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: err.message, errors: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

## Accessing Validated Data

The validated/parsed data is available separately:

```typescript
router.post('/users', {
  body: createSchema({ name: String(), age: Optional(Number()) })
}, (req, res) => {
  req.body             // Original body (may have extra fields)
  req.validatedBody    // Parsed body (types coerced, defaults applied)
  req.validatedQuery   // Parsed query params
  req.validatedParams  // Parsed path params
});
```

Zod strips unknown fields by default, and applies type coercion (e.g., string `"123"` → number `123`).
