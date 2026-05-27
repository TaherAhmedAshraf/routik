# OpenAPI & Swagger

Your API documentation is generated automatically from route definitions.

## Server URL

By default, Swagger UI sends requests to `/` (relative to the docs page). You can configure one or more servers:

```typescript
const router = createRouter({
  servers: [{ url: 'http://localhost:3000', description: 'Development' }]
});
```

If no servers are configured, `[{ url: '/' }]` is used automatically.

## Mount Swagger UI

```typescript
import { createRouter } from 'routik';

const router = createRouter({
  info: { title: 'My API', version: '1.0.0' }
});

// After mounting routes, mount docs
app.use(router.getRouter());
router.mountDocs('/docs', app);

// Visit http://localhost:3000/docs
```

## Adding Metadata

Add descriptions, tags, and response info to your routes:

```typescript
router.post('/users', {
  body: { name: String(), email: Email() },
  meta: {
    summary: 'Create a new user',         // Endpoint title in Swagger
    description: 'Detailed description',   // Optional
    tags: ['users'],                       // Group in Swagger UI
    responses: {
      '201': { description: 'User created' },
      '400': { description: 'Validation error' },
      '409': { description: 'Email already exists' }
    }
  }
}, handler);
```

If `meta.responses` is omitted, a default `200 { description: 'OK' }` response is generated automatically so Swagger always shows a response entry.

## Security Schemes

Configure authentication schemes in `createRouter()`:

```typescript
const router = createRouter({
  info: { title: 'Secure API', version: '1.0.0' },
  securitySchemes: [
    { id: 'bearerAuth', type: 'http', scheme: 'bearer' },
    { id: 'apiKey', type: 'apiKey', in: 'header', name: 'X-API-Key' }
  ]
});
```

This adds an "Authorize" button in Swagger UI. Routes can require auth per-route via `meta.security`:

```typescript
router.get('/users', {
  before: [authRequired],
  meta: {
    summary: 'List users',
    tags: ['users'],
    security: [{ bearerAuth: [] }]   // Shows lock icon in Swagger
  }
}, handler);
```

## Query Parameters

Query string schemas become query parameters in OpenAPI:

```typescript
router.get('/users', {
  query: createSchema({
    page: Optional(String()),
    limit: Optional(String()),
    search: Optional(String())
  }),
  meta: { summary: 'List users with pagination', tags: ['users'] }
}, handler);
```

This generates three query parameters in the OpenAPI spec.

## Path Parameters

Express path params (e.g., `:id`) become path parameters in the spec:

```typescript
router.get('/users/:id', {
  params: createSchema({ id: String() }),
  meta: { summary: 'Get user by ID', tags: ['users'] }
}, handler);
```

## Response Schemas

You can document response structures:

```typescript
router.get('/users/:id', {
  params: createSchema({ id: String() }),
  meta: {
    summary: 'Get user',
    responses: {
      '200': {
        description: 'User object',
        schema: z.object({        // Optional Zod schema for response
          id: z.string(),
          name: z.string(),
          email: z.string().email()
        })
      },
      '404': { description: 'User not found' }
    }
  }
}, handler);
```

## Get Raw Spec

```typescript
const spec = router.getSpec();
// Returns OpenAPI 3.1 JSON object

// Use with your own tools
fs.writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
```

## What's Auto-Generated

- Route paths and HTTP methods
- Request body schemas (from `body`)
- Query parameter schemas (from `query`)
- Path parameter schemas (from `params`)
- Response descriptions (from `meta.responses`)
- Tags and summaries
- Security schemes (from `config.securitySchemes`)
