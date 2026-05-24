# Objects & Arrays

## Objects

Nested objects (deep nesting works!):

```typescript
{
  user: {
    name: String(),
    address: {
      city: String(),
      zip: String()
    }
  }
}
```

## Arrays

Array of strings:

```typescript
{ tags: [String()] }
```

Array of objects:

```typescript
{
  items: [{
    id: String(),
    quantity: Number()
  }]
}
```

## Special Types

```typescript
Json()              // any JSON object
Record(String())    // { [key: string]: string }
```

Next: [Validation](./validation)