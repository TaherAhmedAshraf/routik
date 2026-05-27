# API Reference

## createRouter(config?)

```typescript
import { createRouter } from 'routik';

const router = createRouter({
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Optional description'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' }
  ],
  securitySchemes: [
    { id: 'bearerAuth', type: 'http', scheme: 'bearer' }
  ]
});
```

### Config Options

| Field | Type | Description |
|-------|------|-------------|
| `info` | `{ title?, version?, description? }` | OpenAPI info |
| `servers` | `ServerConfig[]` | OpenAPI servers (defaults to `[{ url: '/' }]`) |
| `securitySchemes` | `SecurityScheme[]` | Auth schemes for Swagger UI |

### SecurityScheme

```typescript
{ id: 'bearerAuth', type: 'http', scheme: 'bearer' }
{ id: 'apiKey', type: 'apiKey', in: 'header', name: 'X-API-Key' }
```

## Route Methods

```typescript
router.get(path, schema?, ...handlers)
router.post(path, schema?, ...handlers)
router.put(path, schema?, ...handlers)
router.patch(path, schema?, ...handlers)
router.delete(path, schema?, ...handlers)
router.head(path, schema?, ...handlers)
router.options(path, schema?, ...handlers)
```

The schema argument is optional. If omitted, all arguments after the path are treated as handlers:

```typescript
router.get('/health', (req, res) => res.json({ ok: true }));
```

You can also pass an array of handlers directly instead of a schema:

```typescript
router.get('/health', [middleware1, middleware2], (req, res) => res.json({ ok: true }));
```

## Schema Object

```typescript
{
  params: Schema,     // Path params: createSchema({ id: String() })
  query: Schema,      // Query string: createSchema({ page: Optional(String()) })
  body: Schema,       // Request body: createSchema({ name: String() })
  meta: {
    summary: string,           // Shown in Swagger UI
    tags: string[],            // Group endpoints
    security?: [{ bearerAuth: [] }],  // Override per-route
    responses?: {
      '200': { description: 'OK', schema?: ZodType },
      '404': { description: 'Not found' }
    }  // If omitted, a default 200 response is auto-generated
  },
  before: [middleware],   // Runs BEFORE validation (auth, rate limit)
  after: [middleware]     // Runs AFTER validation, BEFORE handler (logging)
}
```

## Schema Definition

Schemas can be defined in three ways:

### 1. Type Builders (Recommended)

```typescript
import { createSchema, String, Email, Optional, Number } from 'routik';

createSchema({ name: String(), email: Email(), age: Optional(Number()) })
```

### 2. Raw Zod

```typescript
import { z } from 'zod';

body: z.object({ name: z.string().min(1), email: z.string().email() })
```

## Instance Methods

```typescript
router.getRouter()                    // Get underlying Express Router
router.getSpec()                      // Get OpenAPI spec as object
router.mountDocs('/docs', app)        // Mount Swagger UI at path
router.useGlobal([middleware])        // Add middleware to ALL routes on this router
router.use('/path', subRouter)        // Mount sub-router (merges OpenAPI specs)
```

### useGlobal

Applies middleware to every route on the router. Order: `global -> before -> validation -> after -> handler`.

```typescript
const adminRouter = createRouter();
adminRouter.useGlobal([authRequired, adminRequired]);

adminRouter.get('/users', { meta: { summary: 'List users' } }, handler);
adminRouter.delete('/users/:id', { meta: { summary: 'Delete user' } }, handler);
// Both routes automatically require auth + admin
```

### Sub-router Mounting

```typescript
const usersRouter = createRouter();
usersRouter.get('/', handler);
usersRouter.get('/:id', handler);

const apiRouter = createRouter();
apiRouter.use('/users', usersRouter);  // Mounts at /users, /users/:id

app.use(apiRouter.getRouter());
// GET /users and GET /users/:id are available
// OpenAPI specs are merged automatically
```

## Accessing Validated Data

After validation, the parsed data is available on the request object:

```typescript
router.post('/users', {
  body: createSchema({ name: String(), email: Email() })
}, (req, res) => {
  req.validatedBody   // Parsed body (with defaults applied, coercion, etc.)
  req.validatedQuery  // Parsed query params
  req.validatedParams // Parsed path params
});
```

## Error Handling

Validation errors are passed to Express `next()` with status 400:

```typescript
import type { ValidationError } from 'routik';

app.use((err: ValidationError, req, res, next) => {
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message,             // "Validation failed"
      errors: err.errors              // [{ path: 'email', message: 'Invalid email', code: 'invalid_string' }]
    });
  }
  next(err);
});
```

For structured error handling in your app, throw custom errors and catch them:

```typescript
class NotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found`);
    this.statusCode = 404;
  }
}

// In handler:
if (!user) throw new NotFoundError('User');

// Error handler catches it:
app.use((err, req, res, next) => {
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  next(err);
});
```

## Middleware Order

```
Global → Before → Validation → After → Handler
```

- **Global**: Added via `useGlobal()`, runs on every route
- **Before**: Per-route, runs before validation (auth checks, rate limiting)
- **Validation**: Auto-generated, validates params/query/body
- **After**: Per-route, runs after validation (logging, audit)
- **Handler**: Your route handler

## TypeScript

The package includes full TypeScript declarations. Import types:

```typescript
import type { RouterConfig, RouteSchema, RegisteredRoute, HttpMethod, ValidationError } from 'routik';
```
