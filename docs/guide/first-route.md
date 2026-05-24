# First Route

## Complete Example

```typescript
import express from 'express';
import { createRouter, String, Email } from 'routik';

const app = express();
app.use(express.json());

const router = createRouter({
  info: { title: 'My API', version: '1.0.0' }
});

// Define a route with body validation
router.post('/users', {
  body: {
    name: String(),
    email: Email()
  },
  meta: {
    summary: 'Create user',
    tags: ['users']
  }
}, (req, res) => {
  res.status(201).json({ id: '1', ...req.body });
});

// Mount router and docs
app.use(router.getRouter());
router.mountDocs('/docs', app);

app.listen(3000, () => {
  console.log('API: http://localhost:3000');
  console.log('Docs: http://localhost:3000/docs');
});
```

## Run It

```bash
npx tsx app.ts
```

## What Happens

1. POST `/users` validates `req.body` against the schema
2. If invalid → 400 error with details
3. If valid → your handler runs
4. Swagger docs available at `/docs`

## Next

[Learn Schema Types](./schema-types)