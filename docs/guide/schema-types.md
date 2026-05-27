# Schema Types

Define what data your API accepts.

## Two Ways

```typescript
// 1. Type builders - String(), Number(), etc.
body: { name: String(), age: Number() }

// 2. Raw Zod
body: z.object({ name: z.string() })
```

## Type Builders (Recommended)

Import and use:

```typescript
import { String, Number, Boolean, Email } from 'routik';

body: {
  name: String(),        // string
  age: Number(),         // number
  active: Boolean(),     // boolean
  email: Email(),        // valid email
  url: Url(),           // valid URL
  id: Uuid()            // valid UUID
}
```

## Next: [Basic Types](./schema-basic)