# Schema Types

Define what data your API accepts.

## Three Ways

```typescript
// 1. Type builders - String(), Number(), etc.
body: { name: String(), age: Number() }

// 2. Shorthand strings - 'string', 'number?', etc.
body: { name: 'string', email: 'string.email' }

// 3. Raw Zod
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

## Shorthand Strings

Quick syntax for simple cases:

```typescript
body: {
  name: 'string',              // string
  age: 'number',               // number
  email: 'string.email',       // email format
  score: 'number.min(0).max(100)',  // with constraints
  tag: 'string?'               // optional
}
```

## Next: [Basic Types](./schema-basic)