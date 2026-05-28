# routik

> **⚠️ Beta Notice:** routik is currently in **beta** (`1.0.0-beta.1`). It is not yet production-ready and no guarantees are made about API stability or behavior. Use at your own risk.

Express router wrapper with built-in Zod validation and automatic OpenAPI 3.x documentation generation.

## Features

- **Type-safe validation** — Define schemas using the Type builder API, shorthand strings, or raw Zod
- **Automatic OpenAPI docs** — Routes automatically generate OpenAPI 3.1 specs
- **Swagger UI** — Mount docs at any path with `mountDocs()`
- **Deep nesting** — Inline nested objects without extra syntax
- **Flexible types** — JSON, Record, Arrays of objects, Union, and more
- **Before/After hooks** — Run middleware before or after validation
- **Sub-router mounting** — Compose APIs from multiple routers
- **Validated data access** — Access parsed/validated data via `req.validatedBody`, etc.

## Installation

```bash
npm install routik
```

## Quick Start

```typescript
import express from 'express';
import { createRouter } from 'routik';

const app = express();
app.use(express.json());

const router = createRouter({
  info: { title: 'My API', version: '1.0.0' }
});

router.post('/users', {
  body: {
    name: String(),
    email: Email(),
    age: Optional(Number())
  },
  meta: { summary: 'Create user', tags: ['users'] }
}, (req, res) => {
  res.status(201).json({ id: '123', ...req.body });
});

app.use(router.getRouter());
router.mountDocs('/docs', app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Docs at http://localhost:3000/docs');
});
```

## Schema Definition

### Type Builder API (Recommended)

The Type Builder provides a clean, type-safe way to define schemas:

```typescript
import { createSchema, String, Number, Email, Optional, Array, Enum, Json, Record, Literal, Obj } from 'routik';

// Simple fields
createSchema({ name: String(), email: Email() })

// With constraints
createSchema({
  name: String(),           // string
  age: Number(0, 150),      // number 0-150
  email: Email(),           // valid email
  status: Enum(['active', 'pending'])
})

// Optional fields
createSchema({
  name: String(),
  bio: Optional(String())  // optional string
})

// Nested objects (deep nesting supported!)
createSchema({
  user: {
    name: String(),
    address: {
      city: String(),
      zip: String()
    }
  }
})

// Arrays of objects
createSchema({
  items: [{
    id: String(),
    quantity: Number()
  }]
})

// JSON type for arbitrary data
createSchema({
  metadata: Json()  // accepts any JSON object
})

// Record type for key-value maps
createSchema({
  scores: Record(Number())  // Record<string, number>
})

// Literal types
createSchema({
  status: Literal('active'),
  type: Literal(1)
})
```

### Shorthand Strings

For simple cases, use string shorthand:

```typescript
// body: { name: string, email: string }
body: { name: 'string', email: 'string.email' }

// Optional fields with ?
body: { name: 'string?', email: 'string.email' }

// With constraints
body: {
  name: 'string.min(1)',
  age: 'number.min(0).max(150)',
  uuid: 'string.uuid'
}

// Arrays
body: { tags: 'string[]' }
```

**Shorthand Constraints:**
- `string.min(n)`, `string.max(n)`, `string.length(n)`
- `string.email`, `string.url`, `string.uuid`, `string.cuid`
- `string.regex(/pattern/)`
- `number.min(n)`, `number.max(n)`, `number.positive()`, `number.int()`
- `string?` (optional), `string!` (nullable)
- `string.default("value")`

### Raw Zod

You can still use raw Zod when needed:

```typescript
import { z } from 'zod';

router.post('/users', {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email()
  })
}, handler)
```

## API Reference

### createRouter(config?)

Create a new router instance.

```typescript
const router = createRouter({
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API description'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local' }
  ]
});
```

### Router Methods

```typescript
router.get(path, schema?, ...handlers)
router.post(path, schema?, ...handlers)
router.put(path, schema?, ...handlers)
router.patch(path, schema?, ...handlers)
router.delete(path, schema?, ...handlers)
router.head(path, schema?, ...handlers)
router.options(path, schema?, ...handlers)
```

### Schema Object

```typescript
{
  params?: Schema,    // URL parameters
  query?: Schema,    // Query string
  body?: Schema,     // Request body
  meta?: {           // OpenAPI metadata
    summary?: string,
    tags?: string[],
    responses?: { [code]: { description: string } }
  },
  before?: RequestHandler[],  // Middleware before validation
  after?: RequestHandler[]    // Middleware after validation
}
```

### Mounting Sub-Routers

You can mount one ZodRouter onto another at a path prefix:

```typescript
const usersRouter = createRouter({ info: { title: 'Users API' } });
usersRouter.get('/', { meta: { summary: 'List users' } }, (req, res) => res.json([]));
usersRouter.get('/:id', { meta: { summary: 'Get user' } }, (req, res) => res.json({}));

const apiRouter = createRouter({ info: { title: 'API' } });
apiRouter.use('/users', usersRouter);  // Mounts at /users and /users/:id

app.use(apiRouter.getRouter());
```

Routes are automatically merged into the parent router's OpenAPI spec.

### Before/After Hooks

Run middleware before or after validation:

```typescript
router.post('/users', {
  body: { name: 'string' },
  before: [authMiddleware],      // Runs before validation
  after: [logMiddleware]          // Runs after validation, before handler
}, (req, res) => {
  // Handler
});
```

### Accessing Validated Data

After validation, access the validated data:

```typescript
router.post('/users', {
  body: createSchema({ name: String(), email: Email() })
}, (req, res) => {
  // req.body - original body (may be mutated by Zod)
  // req.validatedBody - the validated & parsed body
  // req.validatedQuery - validated query params
  // req.validatedParams - validated path params
  res.json(req.validatedBody);
});
```

### Union Types

For union of literal values, use `Union()`:

```typescript
createSchema({
  status: Union([Literal('active'), Literal('inactive'), Literal('pending')])
})
```

### Error Handling

Validation errors are passed to `next()` with a structured error:

```typescript
app.use((err, req, res, next) => {
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message,      // "Validation failed"
      errors: err.errors       // [{ path: 'email', message: 'Invalid email' }]
    });
  }
  next(err);
});
```

### Type Builders

| Function | Description | Example |
|----------|-------------|---------|
| `String()` | String type | `String()` |
| `Number()` | Number type | `Number(0, 100)` |
| `Boolean()` | Boolean type | `Boolean()` |
| `Email()` | Email validation | `Email()` |
| `Url()` | URL validation | `Url()` |
| `Uuid()` | UUID validation | `Uuid()` |
| `Int(min, max)` | Integer with range | `Int(0, 150)` |
| `Positive()` | Positive number | `Positive()` |
| `Negative()` | Negative number | `Negative()` |
| `Enum(values)` | Enum values | `Enum(['a', 'b'])` |
| `Literal(value)` | Literal value | `Literal('active')` |
| `Union([...])` | Union of types | `Union([Literal('a'), Literal('b')])` |
| `Optional(schema)` | Optional field | `Optional(String())` |
| `Nullable(schema)` | Nullable field | `Nullable(String())` |
| `Array(schema)` | Array of type | `Array(String())` |
| `Obj({...})` | Nested object | `Obj({ name: String() })` |
| `Json()` | Arbitrary JSON | `Json()` |
| `Record(valueType)` | Key-value map | `Record(Number())` |
| `Any()` | Any type | `Any()` |
| `Never()` | Never type | `Never()` |
| `createSchema({...})` | Create full schema | `createSchema({...})` |

### Router Instance Methods

```typescript
router.getRouter()           // Get underlying Express Router
router.getSpec()              // Get OpenAPI spec as object
router.mountDocs(path, app)   // Mount Swagger UI at path
router.useGlobal([...mwares]) // Add global middleware
router.use(path, subRouter)   // Mount sub-router at path
```

## Example: Full CRUD API

```typescript
import express from 'express';
import { createRouter, String, Number, Email, Optional, createSchema } from 'routik';

const app = express();
app.use(express.json());

const router = createRouter({
  info: { title: 'Users API', version: '1.0.0' }
});

// Validation schemas
const createUserSchema = createSchema({
  name: String(),
  email: Email(),
  age: Optional(Number())
});

const updateUserSchema = createSchema({
  name: Optional(String()),
  email: Optional(Email()),
  age: Optional(Number())
});

// Routes
router.get('/users', {
  query: createSchema({ page: Optional(String()), limit: Optional(String()) }),
  meta: { summary: 'List users', tags: ['users'] }
}, (req, res) => {
  res.json({ data: [], total: 0 });
});

router.get('/users/:id', {
  params: createSchema({ id: String() }),
  meta: { summary: 'Get user', tags: ['users'] }
}, (req, res) => {
  res.json({ id: req.params.id, name: 'John', email: 'john@example.com' });
});

router.post('/users', {
  body: createUserSchema,
  meta: { summary: 'Create user', tags: ['users'] }
}, (req, res) => {
  res.status(201).json({ id: '123', ...req.body });
});

router.put('/users/:id', {
  params: createSchema({ id: String() }),
  body: updateUserSchema,
  meta: { summary: 'Update user', tags: ['users'] }
}, (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/users/:id', {
  params: createSchema({ id: String() }),
  meta: { summary: 'Delete user', tags: ['users'] }
}, (req, res) => {
  res.status(204).send();
});

app.use(router.getRouter());
router.mountDocs('/docs', app);

app.listen(3000);
```

## License

MIT