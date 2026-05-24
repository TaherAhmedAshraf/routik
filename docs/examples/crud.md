# CRUD API Example

## app.ts

```typescript
import express from 'express';
import { createRouter, String, Email, Optional, Number } from 'routik';

const app = express();
app.use(express.json());

const router = createRouter({ info: { title: 'Users API' } });

// Create
router.post('/users', {
  body: { name: String(), email: Email() },
  meta: { summary: 'Create user', tags: ['users'] }
}, (req, res) => {
  res.status(201).json({ id: '1', ...req.body });
});

// List
router.get('/users', {
  meta: { summary: 'List users', tags: ['users'] }
}, (req, res) => {
  res.json({ data: [] });
});

// Get One
router.get('/users/:id', {
  params: { id: String() },
  meta: { summary: 'Get user', tags: ['users'] }
}, (req, res) => {
  res.json({ id: req.params.id });
});

// Update
router.put('/users/:id', {
  params: { id: String() },
  body: { name: Optional(String()), email: Optional(Email()) },
  meta: { summary: 'Update user', tags: ['users'] }
}, (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

// Delete
router.delete('/users/:id', {
  params: { id: String() },
  meta: { summary: 'Delete user', tags: ['users'] }
}, (req, res) => {
  res.status(204).send();
});

app.use(router.getRouter());
router.mountDocs('/docs', app);
app.listen(3000);
```

## Run

```bash
npx tsx app.ts
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /users | Create user |
| GET | /users | List users |
| GET | /users/:id | Get user |
| PUT | /users/:id | Update user |
| DELETE | /users/:id | Delete user |