# Full API with Sub-routers

## Structure

```
app.ts
routes/
  users.ts
  orders.ts
```

## routes/users.ts

```typescript
import { createRouter, String, Email } from 'routik';

const router = createRouter({ info: { title: 'Users API' } });

router.get('/', { meta: { summary: 'List users' } }, (req, res) => res.json([]));
router.post('/', { body: { name: String(), email: Email() }, meta: { summary: 'Create' } }, (req, res) => res.status(201).json({}));

export default router;
```

## app.ts

```typescript
import express from 'express';
import { createRouter } from 'routik';
import usersRouter from './routes/users';
import ordersRouter from './routes/orders';

const app = express();
app.use(express.json());

const apiRouter = createRouter({ info: { title: 'My API' } });

apiRouter.use('/users', usersRouter);
apiRouter.use('/orders', ordersRouter);

app.use(apiRouter.getRouter());
apiRouter.mountDocs('/docs', app);
app.listen(3000);
```

## Benefits

- Split routes into files
- Reusable route groups
- Unified OpenAPI spec