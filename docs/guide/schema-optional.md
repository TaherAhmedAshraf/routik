# Optional & Enum

## Optional

Fields that can be missing:

```typescript
Optional(String())      // string or undefined
Optional(Number(), 0)    // with default value
```

With shorthand:
```typescript
{ name: 'string' }      // required
{ name: 'string?' }      // optional
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

Multiple options:

```typescript
Union([Literal('a'), Literal('b')])
```

Next: [Objects & Arrays](./schema-objects)