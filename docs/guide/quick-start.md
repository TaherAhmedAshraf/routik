# Quick Start

Build your first API with routik in minutes.

## Installation

```bash
npm install routik
```

## Basic Setup

```typescript
import express from 'express';
import { createRouter, String, Email, createSchema } from 'routik';

const app = express();
app.use(express.json());

// Create router with API info
const router = createRouter({
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'An API built with routik'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local server' }
  ]
});

// Define a schema
const userSchema = createSchema({
  name: String(),
  email: Email()
});

// Add routes
router.post('/users', {
  body: userSchema,
  meta: {
    summary: 'Create a new user',
    tags: ['users'],
    responses: {
      '201': { description: 'User created successfully' },
      '400': { description: 'Validation error' }
    }
  }
}, (req, res) => {
  // req.body is validated
  res.status(201).json({ id: '123', ...req.body });
});

router.get('/users', {
  meta: {
    summary: 'List all users',
    tags: ['users']
  }
}, (req, res) => {
  res.json({ users: [] });
});

// Mount the router and Swagger docs
app.use(router.getRouter());
router.mountDocs('/docs', app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Docs available at http://localhost:3000/docs');
});
```

## Test Your API

Start the server:

```bash
npx tsx app.ts
```

Visit:
- `http://localhost:3000/docs` - Swagger UI with your API documentation
- `http://localhost:3000/users` - Your actual API endpoint

## Using Zod Directly

You can also use raw Zod schemas:

```typescript
import { z } from 'zod';

router.post('/users', {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email()
  })
}, handler);
```

## Next Steps

- [Schema Types](./schema-types) - Learn all available type builders
- [Validation](./validation) - Understand how validation works
- [OpenAPI](./openapi) - Configure your API documentation