# Unions

Combine multiple types into one — a value must match at least one of the options.

## Union of Literals (Like Enum)

```typescript
import { Union, Literal } from 'routik';

createSchema({
  status: Union([
    Literal('active'),
    Literal('inactive'),
    Literal('pending')
  ])
});
// Valid: 'active', 'inactive', 'pending'
```

This is equivalent to `Enum(['active', 'inactive', 'pending'])`. Use `Enum` for simple string-only sets, and `Union` when you need more flexibility.

## Union of Different Types

Mix strings, numbers, booleans — any type builder works inside a Union:

```typescript
createSchema({
  value: Union([
    String(),
    Number(),
    Boolean()
  ])
});
// Valid: 'hello', 42, true
```

## Union with Objects (Polymorphic Payloads)

The most powerful use case — accept different object shapes:

```typescript
createSchema({
  event: Union([
    Obj({
      type: Literal('page_view'),
      url: String(),
      referrer: Optional(String())
    }),
    Obj({
      type: Literal('click'),
      target: String(),
      x: Number(),
      y: Number()
    }),
    Obj({
      type: Literal('purchase'),
      productId: String(),
      amount: Number()
    })
  ])
});
```

Each object in the union must match its own shape. The `Literal('page_view')`, `Literal('click')` etc. act as discriminating fields — Zod tries each option and picks the first match.

## Union with Optional

```typescript
createSchema({
  contact: Optional(
    Union([Email(), Url()])
  )
});
// Valid: 'user@example.com', 'https://site.com', or undefined
```

## Union with Nullable

```typescript
createSchema({
  result: Nullable(
    Union([String(), Number()])
  )
});
// Valid: 'ok', 42, or null
```

## Union with Array

```typescript
createSchema({
  ids: Union([
    Array(String()),
    Array(Number())
  ])
});
// Valid: ['a', 'b'] or [1, 2, 3]
```

## Single-Option Union

A union with one option unwraps to that type directly:

```typescript
const schema = Union([String()]);
// Equivalent to just String()
```

## When to Use Enum vs Union

| Use Case | Recommended |
|----------|-------------|
| Simple set of strings: `'a' \| 'b' \| 'c'` | `Enum(['a', 'b', 'c'])` |
| Single string values with literals | `Enum` |
| Mixed types: `string \| number` | `Union([String(), Number()])` |
| Discriminated object unions | `Union([Obj({...}), Obj({...})])` |
| Need fine-grained control | `Union` |

`Enum` is a convenience wrapper for `Union([Literal('a'), Literal('b')])`. Choose `Union` whenever your options go beyond plain string literals.

## Next: [Objects & Arrays](./schema-objects)
