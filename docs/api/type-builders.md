# Type Builders

Build validation schemas with the Type Builder API.

## Basic Types

| Function | Returns | Description |
|----------|---------|-------------|
| `String(min?, max?)` | `string` | String with optional length range |
| `Number(min?, max?)` | `number` | Number with optional range |
| `Boolean()` | `boolean` | Boolean |
| `Int(min?, max?)` | `number` | Integer with optional range |
| `Positive()` | `number` | Positive number (> 0) |
| `Negative()` | `number` | Negative number (< 0) |

## String Formats

| Function | Validates |
|----------|-----------|
| `Email()` | Valid email address |
| `Url()` | Valid URL |
| `Uuid()` | Valid UUID v4 |
| `Regex(/pattern/)` | Custom regex pattern |
| `DateTime()` | Valid ISO datetime |

## Modifiers

| Function | Description |
|----------|-------------|
| `Optional(schema, default?)` | Field can be `undefined` (with optional default) |
| `Nullable(schema)` | Field can be `null` |
| `Array(schema)` | Array of items matching schema |

## Enum & Union

| Function | Description |
|----------|-------------|
| `Enum(['a', 'b', 'c'])` | Must be one of the values |
| `Literal(value)` | Exact match (string, number, or boolean) |
| `Union([...])` | Accepts any of the listed types |

### Union Examples

String literals (like `Enum`):
```typescript
Union([Literal('a'), Literal('b'), Literal('c')])
```

Mixed types:
```typescript
Union([String(), Number()])
```

Discriminated object union:
```typescript
Union([
  Obj({ kind: Literal('circle'), radius: Number() }),
  Obj({ kind: Literal('square'), side: Number() })
])
```

See the [Unions guide](../guide/schema-unions) for detailed patterns.

## Complex Types

| Function | Description |
|----------|-------------|
| `Obj({...})` | Explicit object (use when builder can't infer) |
| `Record(valueType, keyType?)` | `Record<string, valueType>` |
| `Json()` | Any JSON-serializable object |

### Record Example

```typescript
import { Record, Number } from 'routik';

createSchema({
  scores: Record(Number())   // { [key: string]: number }
});
```

### Json Example

```typescript
import { Json } from 'routik';

createSchema({
  metadata: Json()   // Any JSON value
});
```

## Special Types

| Function | Description |
|----------|-------------|
| `Any()` | Accepts any value |
| `Never()` | Rejects all values |
| `Void()` | Only `undefined` |
| `Undefined()` | Only `undefined` |
| `Custom(zodSchema)` | Use a raw Zod schema |

## createSchema

Converts object definitions to a Zod object schema:

```typescript
import { createSchema, String, Email, Optional, Number } from 'routik';

const userSchema = createSchema({
  name: String(1, 100),
  email: Email(),
  age: Optional(Number(0, 150))
});
// Returns: ZodObject
```

## Nested Objects

Deep nesting works automatically:

```typescript
createSchema({
  user: {
    name: String(),
    address: {
      city: String(),
      zip: String()
    }
  }
});
```

## Array of Objects

```typescript
createSchema({
  items: [{
    id: String(),
    quantity: Number()
  }]
});
```

When wrapping in `Optional()`, use the `Array()` builder:

```typescript
import { Array, Obj } from 'routik';

createSchema({
  tags: Optional(Array(String())),         // string[] or undefined
  items: Optional(Array(Obj({              // object[] or undefined
    productId: String(),
    quantity: Positive()
  })))
});
```
