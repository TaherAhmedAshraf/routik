# Basic Types

## String

```typescript
String()              // any string
String(1, 100)        // length 1-100
```

## Number

```typescript
Number()              // any number
Number(0, 100)        // 0 to 100
Positive()            // > 0
Int(1, 10)           // integer 1-10
```

## Boolean

```typescript
Boolean()             // true or false
```

## Email & URL

```typescript
Email()               // valid email
Url()                 // valid URL
Uuid()                // valid UUID
```

## Examples

```typescript
body: {
  name: String(),
  age: Number(0, 150),
  email: Email(),
  website: Url()
}
```

Next: [Optional & Enum](./schema-optional)