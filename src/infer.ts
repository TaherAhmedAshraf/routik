import { z, ZodType, ZodObject, ZodOptional, ZodNullable, ZodArray, ZodUnion, ZodDefault, ZodTypeAny } from 'zod';

type StringSchema = { type: 'string'; min?: number; max?: number; email?: boolean; url?: boolean; uuid?: boolean; regex?: RegExp; default?: any };
type NumberSchema = { type: 'number'; min?: number; max?: number; int?: boolean; positive?: boolean; negative?: boolean; default?: any };
type BooleanSchema = { type: 'boolean'; default?: any };
type DateSchema = { type: 'date'; min?: Date; max?: Date };
type EnumSchema = { type: 'enum'; values: string[] };
type LiteralSchema = { type: 'literal'; value: string | number | boolean };
type OptionalSchemaBase = { type: 'optional'; default?: any };
type NullableSchemaBase = { type: 'nullable' };
type ArraySchemaBase = { type: 'array' };
type UnionSchemaBase = { type: 'union' };
type ObjectSchemaBase = { type: 'object'; properties: Record<string, SchemaDefinition>; required?: string[] };
type RecordSchemaBase = { type: 'record'; valueType: SchemaDefinition; keyType?: SchemaDefinition };
type JsonSchemaBase = { type: 'json' };
type AnySchemaBase = { type: 'any' };
type NeverSchemaBase = { type: 'never' };
type VoidSchemaBase = { type: 'void' };
type UndefinedSchemaBase = { type: 'undefined' };

export interface OptionalSchema extends OptionalSchemaBase { inner: SchemaDefinition }
export interface NullableSchema extends NullableSchemaBase { inner: SchemaDefinition }
export interface ArraySchema extends ArraySchemaBase { inner: SchemaDefinition }
export interface UnionSchema extends UnionSchemaBase { options: SchemaDefinition[] }
export interface ObjectSchema extends ObjectSchemaBase {}
export interface RecordSchema extends RecordSchemaBase {}
export interface JsonSchema extends JsonSchemaBase {}
export interface AnySchema extends AnySchemaBase {}
export interface NeverSchema extends NeverSchemaBase {}
export interface VoidSchema extends VoidSchemaBase {}
export interface UndefinedSchema extends UndefinedSchemaBase {}

export type SchemaDefinition =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | DateSchema
  | EnumSchema
  | LiteralSchema
  | OptionalSchema
  | NullableSchema
  | ArraySchema
  | UnionSchema
  | ObjectSchema
  | RecordSchema
  | JsonSchema
  | AnySchema
  | NeverSchema
  | VoidSchema
  | UndefinedSchema
  | { type: 'custom'; schema: ZodType };

function string(min?: number, max?: number): StringSchema {
  return { type: 'string', ...(min !== undefined && { min }), ...(max !== undefined && { max }) };
}

function email(): StringSchema {
  return { type: 'string', email: true };
}

function url(): StringSchema {
  return { type: 'string', url: true };
}

function uuid(): StringSchema {
  return { type: 'string', uuid: true };
}

function regex(pattern: RegExp): StringSchema {
  return { type: 'string', regex: pattern };
}

function number(min?: number, max?: number, int?: boolean): NumberSchema {
  return { type: 'number', ...(min !== undefined && { min }), ...(max !== undefined && { max }), ...(int !== undefined && { int }) };
}

function int(min?: number, max?: number): NumberSchema {
  return { type: 'number', min, max, int: true };
}

function positive(): NumberSchema {
  return { type: 'number', positive: true };
}

function negative(): NumberSchema {
  return { type: 'number', negative: true };
}

function boolean_(): BooleanSchema {
  return { type: 'boolean' };
}

function date(min?: Date, max?: Date): DateSchema {
  return { type: 'date', ...(min !== undefined && { min }), ...(max !== undefined && { max }) };
}

function enum_(values: string[]): EnumSchema {
  return { type: 'enum', values };
}

function literal<T extends string | number | boolean>(value: T): LiteralSchema {
  return { type: 'literal', value };
}

function optional(field: SchemaDefinition, defaultValue?: any): OptionalSchema {
  return { type: 'optional', inner: field, ...(defaultValue !== undefined && { default: defaultValue }) };
}

function nullable(field: SchemaDefinition): NullableSchema {
  return { type: 'nullable', inner: field };
}

function array(field: SchemaDefinition): ArraySchema {
  return { type: 'array', inner: field };
}

function union(options: SchemaDefinition[]): UnionSchema {
  return { type: 'union', options };
}

function object(properties: Record<string, SchemaDefinition>, required?: string[]): ObjectSchema {
  return { type: 'object', properties, ...(required && { required }) };
}

function record(valueType: SchemaDefinition, keyType?: SchemaDefinition): RecordSchema {
  return { type: 'record', valueType, ...(keyType && { keyType }) };
}

function json(): JsonSchema {
  return { type: 'json' };
}

function any(): AnySchema {
  return { type: 'any' };
}

function never(): NeverSchema {
  return { type: 'never' };
}

function void_(): VoidSchema {
  return { type: 'void' };
}

function undefined_(): UndefinedSchema {
  return { type: 'undefined' };
}

function custom<T extends ZodType>(schema: T): { type: 'custom'; schema: T } {
  return { type: 'custom', schema };
}

export const String = string;
export const Email = email;
export const Url = url;
export const Uuid = uuid;
export const Regex = regex;
export const Number = number;
export const Int = int;
export const Positive = positive;
export const Negative = negative;
export const Boolean = boolean_;
export const DateTime = date;
export const Enum = enum_;
export const Literal = literal;
export const Optional = optional;
export const Nullable = nullable;
export const Array = array;
export const Union = union;
export const Obj = object;
export const Record = record;
export const Json = json;
export const Any = any;
export const Never = never;
export const Void = void_;
export const Undefined = undefined_;
export const Custom = custom;

function normalizeToSchemaDefinition(value: any, isRequired: boolean = true): SchemaDefinition {
  if (!value) {
    return { type: 'any' };
  }

  if (value instanceof ZodType) {
    return { type: 'custom', schema: value };
  }

  if (typeof value === 'function') {
    const meta = (value as any)._zodMeta;
    if (meta instanceof ZodType) {
      return { type: 'custom', schema: meta };
    }
    return { type: 'any' };
  }

  if (globalThis.Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', inner: { type: 'any' } };
    }
    const first = normalizeToSchemaDefinition(value[0], true);
    if (value.length === 1) {
      return { type: 'array', inner: first };
    }
    const allSame = value.every((item: any) => {
      const normalized = normalizeToSchemaDefinition(item, true);
      return normalized.type === first.type ||
        (normalized.type === 'custom' && first.type === 'custom');
    });
    if (allSame) {
      return { type: 'array', inner: first };
    }
    return { type: 'array', inner: first };
  }

  if (typeof value === 'object') {
    if ('type' in value && typeof (value as any).type === 'string') {
      const typed = value as any;
      if (['optional', 'nullable', 'array'].includes(typed.type) && typed.inner) {
        return { ...typed, inner: normalizeToSchemaDefinition(typed.inner, true) } as SchemaDefinition;
      }
      if (typed.type === 'union' && globalThis.Array.isArray(typed.options)) {
        return { ...typed, options: typed.options.map((o: any) => normalizeToSchemaDefinition(o, true)) } as SchemaDefinition;
      }
      if (typed.type === 'record') {
        const result: any = { ...typed };
        if (typed.valueType) result.valueType = normalizeToSchemaDefinition(typed.valueType, true);
        if (typed.keyType) result.keyType = normalizeToSchemaDefinition(typed.keyType, true);
        return result as SchemaDefinition;
      }
      return value as SchemaDefinition;
    }

    if ('_zodMeta' in value) {
      return { type: 'custom', schema: (value as any)._zodMeta };
    }

    const properties: Record<string, SchemaDefinition> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(value)) {
      const isValRequired = isRequired && val !== undefined && val !== null;
      properties[key] = normalizeToSchemaDefinition(val, isValRequired);

      if (isValRequired && !isOptionalField(val)) {
        required.push(key);
      }
    }

    return { type: 'object', properties, ...(required.length > 0 && { required }) };
  }

  if (typeof value === 'string') {
    if (value === 'any') return { type: 'any' };
    if (value === 'never') return { type: 'never' };
    if (value === 'void') return { type: 'void' };
    if (value === 'undefined') return { type: 'undefined' };
  }

  return { type: 'any' };
}

function isOptionalField(value: any): boolean {
  if (!value) return true;
  if (typeof value === 'function' && (value as any)._zodMeta) {
    const meta = (value as any)._zodMeta;
    if (meta && typeof meta === 'object' && '_def' in meta) {
      const def = meta._def as any;
      if (def && (def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault')) {
        return true;
      }
    }
  }
  if (typeof value === 'object' && 'type' in value) {
    const t = (value as any).type;
    if (t === 'optional' || t === 'nullable' || t === 'any' || t === 'undefined') {
      return true;
    }
  }
  return false;
}

function schemaToZod(field: SchemaDefinition): ZodType<any> {
  switch (field.type) {
    case 'string': {
      let s: ZodType<any> = z.string();
      if (field.email) s = (s as any).email();
      else if (field.url) s = (s as any).url();
      else if (field.uuid) s = (s as any).uuid();
      else if (field.regex) s = (s as any).regex(field.regex);
      if (field.min !== undefined) s = (s as any).min(field.min);
      if (field.max !== undefined) s = (s as any).max(field.max);
      if (field.default !== undefined) s = z.string().default(field.default);
      return s;
    }
    case 'number': {
      let s: ZodType<any> = z.number();
      if (field.int) s = (s as any).int();
      if (field.positive) s = (s as any).positive();
      else if (field.negative) s = (s as any).negative();
      if (field.min !== undefined) s = (s as any).min(field.min);
      if (field.max !== undefined) s = (s as any).max(field.max);
      if (field.default !== undefined) s = z.number().default(field.default);
      return s;
    }
    case 'boolean': {
      if (field.default !== undefined) {
        return z.boolean().default(field.default);
      }
      return z.boolean();
    }
    case 'date': {
      let s: ZodType<any> = z.date();
      if (field.min) s = (s as any).min(field.min);
      if (field.max) s = (s as any).max(field.max);
      return s;
    }
    case 'enum':
      return z.enum(field.values as [string, ...string[]]);
    case 'literal':
      return z.literal(field.value);
    case 'optional': {
      const inner = schemaToZod(field.inner);
      if (field.default !== undefined) {
        return inner.optional().default(field.default);
      }
      return inner.optional();
    }
    case 'nullable':
      return z.nullable(schemaToZod(field.inner));
    case 'array':
      return z.array(schemaToZod(field.inner));
    case 'union': {
      const options = field.options.map(o => schemaToZod(o));
      if (options.length === 1) {
        return options[0];
      }
      return (z.union as any)(options);
    }
    case 'object': {
      const shape: Record<string, ZodType<any>> = {};
      const requiredFields = field.required || Object.keys(field.properties);
      for (const [key, value] of Object.entries(field.properties)) {
        const schema = schemaToZod(value);
        if (!requiredFields.includes(key)) {
          shape[key] = schema.optional();
        } else {
          shape[key] = schema;
        }
      }
      return z.object(shape);
    }
    case 'record': {
      const valueSchema = schemaToZod(field.valueType);
      if (field.keyType) {
        return z.record(schemaToZod(field.keyType), valueSchema);
      }
      return z.record(z.string(), valueSchema);
    }
    case 'json':
      return z.record(z.string(), z.any());
    case 'any':
      return z.any();
    case 'never':
      return z.never();
    case 'void':
      return z.void();
    case 'undefined':
      return z.undefined();
    case 'custom':
      return field.schema;
  }
}

export function Type<T extends Record<string, any>>(definition: Record<string, any>): {
  _zodMeta: ZodObject<any>;
  _typeInfo?: T;
} {
  const normalized = normalizeToSchemaDefinition(definition);
  const objSchema = normalized as ObjectSchema;
  const zodSchema = schemaToZod(object(objSchema.properties || {})) as ZodObject<any>;
  return {
    _zodMeta: zodSchema,
    _typeInfo: undefined as any,
  };
}

export function createSchema<T extends Record<string, any>>(
  definition: Record<string, any>
): ZodObject<any> {
  const normalized = normalizeToSchemaDefinition(definition);
  if (normalized.type === 'object') {
    const objSchema = normalized as ObjectSchema;
    return schemaToZod(object(objSchema.properties || {})) as ZodObject<any>;
  }
  return schemaToZod(normalized) as ZodObject<any>;
}

export function maybeParseType<T>(value: any): ZodType<any> | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && '_zodMeta' in value) {
    return value._zodMeta as ZodType<any>;
  }
  if (typeof value === 'function' && (value as any)._zodMeta) {
    return (value as any)._zodMeta as ZodType<any>;
  }
  if (value instanceof ZodType) {
    return value;
  }
  return undefined;
}