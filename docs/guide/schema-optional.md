# Optional & Enum

## Optional

Fields that can be missing:

```typescript
Optional(String())      // string or undefined
Optional(Number(), 0)    // with default value
```

## Enum

Pick from a list:

```typescript
Enum(['active', 'inactive', 'pending'])
```

## Literal

Exact value:

```typescript
Literal('admin')     // only 'admin'
Literal(1)          // only 1
Literal(true)       // only true
```

## Union

Combine multiple types into one. See the [Unions guide](./schema-unions) for detailed usage.

Next: [Unions](./schema-unions)