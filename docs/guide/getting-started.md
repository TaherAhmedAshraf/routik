# Introduction

routik adds **Zod validation** and **OpenAPI docs** to Express.

## What it does

```typescript
// Instead of manual validation
router.post('/users', (req, res) => {
  if (!req.body.email) return res.status(400).json({ error: 'Email required' });
  // ...
});

// With routik - validation is automatic
router.post('/users', {
  body: { email: 'string.email' },  // validates automatically
  meta: { summary: 'Create user' }
}, (req, res) => {
  // req.body is validated!
  res.json({ id: '1', ...req.body });
});
```

## Features

- **Auto validation** - Zod schemas validate request data
- **Auto docs** - Routes generate OpenAPI specs
- **Clean API** - Simple, chainable type builders
- **Composable** - Split routes into sub-routers

## Next Steps

1. [Install](./installation) - Add to your project
2. [First Route](./first-route) - Build a simple API
3. [Schema Types](./schema-types) - Learn type builders