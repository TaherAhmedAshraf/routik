# Sub-routers

Split your API into files.

## Create a Router

```typescript
// routes/users.ts
import { createRouter, String } from 'routik';

const usersRouter = createRouter();

usersRouter.get('/', handler);
usersRouter.get('/:id', handler);
usersRouter.post('/', {
  body: { name: String() }
}, handler);

export default usersRouter;
```

## Mount It

```typescript
// app.ts
import express from 'express';
import { createRouter } from 'routik';
import usersRouter from './routes/users';

const app = express();
const apiRouter = createRouter();

apiRouter.use('/users', usersRouter);  // mounts at /users

app.use(apiRouter.getRouter());
apiRouter.mountDocs('/docs', app);
```

## Result

Routes are now:
- `GET /users`
- `GET /users/:id`
- `POST /users`

Next: [OpenAPI](./openapi)