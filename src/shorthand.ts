import { z, ZodType, ZodObject, ZodArray, ZodUnion, ZodOptional, ZodDefault, ZodNullable, ZodEffects } from 'zod';

export type ShorthandValue = string;

export type ShorthandObject = {
  [key: string]: ShorthandValue | ShorthandObject | ShorthandObject[];
};

export function isShorthandValue(value: any): value is ShorthandValue {
  return typeof value === 'string';
}

export function isShorthandObject(obj: any): obj is ShorthandObject {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some(v =>
    typeof v === 'string' || isShorthandObject(v) || (Array.isArray(v) && v.every(i => isShorthandObject(i)))
  );
}

type TypeModifier = 'optional' | 'nullable' | 'nullish';
type ArrayModifier = { type: 'array'; itemType: string };

interface ParsedType {
  baseType: string;
  modifiers: TypeModifier[];
  arrayModifier?: ArrayModifier;
  constraints: Record<string, any>;
  defaultValue?: any;
  enumValues?: string[];
}

function parseConstraints(typeStr: string, baseType: string): Record<string, any> {
  const constraints: Record<string, any> = {};

  if (baseType === 'string') {
    const minMatch = typeStr.match(/string\.min\((\d+)\)/);
    if (minMatch) constraints.min = parseInt(minMatch[1]);

    const maxMatch = typeStr.match(/string\.max\((\d+)\)/);
    if (maxMatch) constraints.max = parseInt(maxMatch[1]);

    const lengthMatch = typeStr.match(/string\.length\((\d+)\)/);
    if (lengthMatch) constraints.length = parseInt(lengthMatch[1]);

    const regexMatch = typeStr.match(/string\.regex\(([^)]+)\)/);
    if (regexMatch) {
      try {
        constraints.regex = new RegExp(regexMatch[1].replace(/^\/|\/$/g, ''));
      } catch {}
    }

    const includesMatch = typeStr.match(/string\.includes\(([^)]+)\)/);
    if (includesMatch) constraints.includes = includesMatch[1].replace(/^["']|["']$/g, '');

    const startsWithMatch = typeStr.match(/string\.startsWith\(([^)]+)\)/);
    if (startsWithMatch) constraints.startsWith = startsWithMatch[1].replace(/^["']|["']$/g, '');

    const endsWithMatch = typeStr.match(/string\.endsWith\(([^)]+)\)/);
    if (endsWithMatch) constraints.endsWith = endsWithMatch[1].replace(/^["']|["']$/g, '');

    const uuidMatch = typeStr.match(/string\.uuid/);
    if (uuidMatch) constraints.uuid = true;

    const emailMatch = typeStr.match(/string\.email/);
    if (emailMatch) constraints.email = true;

    const urlMatch = typeStr.match(/string\.url/);
    if (urlMatch) constraints.url = true;

    const cuidMatch = typeStr.match(/string\.cuid/);
    if (cuidMatch) constraints.cuid = true;

    const datetimeMatch = typeStr.match(/string\.datetime/);
    if (datetimeMatch) constraints.datetime = true;

    const ipMatch = typeStr.match(/string\.ip/);
    if (ipMatch) constraints.ip = true;
  }

  if (baseType === 'number' || baseType === 'int' || baseType === 'integer') {
    const minMatch = typeStr.match(/(?:number|int|integer)\.min\((\d+(?:\.\d+)?)\)/);
    if (minMatch) constraints.min = parseFloat(minMatch[1]);

    const maxMatch = typeStr.match(/(?:number|int|integer)\.max\((\d+(?:\.\d+)?)\)/);
    if (maxMatch) constraints.max = parseFloat(maxMatch[1]);

    const multipleMatch = typeStr.match(/(?:number|int|integer)\.multipleOf\((\d+(?:\.\d+)?)\)/);
    if (multipleMatch) constraints.multipleOf = parseFloat(multipleMatch[1]);

    if (typeStr.includes('.positive()')) constraints.positive = true;
    if (typeStr.includes('.negative()')) constraints.negative = true;
    if (typeStr.includes('.nonpositive()')) constraints.nonpositive = true;
    if (typeStr.includes('.nonnegative()')) constraints.nonnegative = true;
    if (typeStr.includes('.int()') || baseType === 'int' || baseType === 'integer') constraints.int = true;
  }

  if (baseType === 'date') {
    const minMatch = typeStr.match(/date\.min\(([^)]+)\)/);
    if (minMatch) constraints.min = new Date(minMatch[1].replace(/^["']|["']$/g, ''));

    const maxMatch = typeStr.match(/date\.max\(([^)]+)\)/);
    if (maxMatch) constraints.max = new Date(maxMatch[1].replace(/^["']|["']$/g, ''));
  }

  return constraints;
}

function parseDefault(typeStr: string): { defaultValue?: any; rest: string } {
  const match = typeStr.match(/^(.+?)\.default\(([^)]+)\)$/);
  if (match) {
    let defaultValue: any = match[2];
    try {
      defaultValue = JSON.parse(match[2]);
    } catch {
      if (defaultValue === 'undefined') defaultValue = undefined;
      if (defaultValue === 'null') defaultValue = null;
      if (defaultValue === 'true') defaultValue = true;
      if (defaultValue === 'false') defaultValue = false;
    }
    return { defaultValue, rest: match[1] };
  }
  return { rest: typeStr };
}

function parseEnum(typeStr: string): { enumValues?: string[]; rest: string } {
  const match = typeStr.match(/^(.+?)\.enum\(([^)]+)\)$/);
  if (match) {
    const enumValues = match[2].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    return { enumValues, rest: match[1] };
  }
  return { rest: typeStr };
}

function parseModifiers(typeStr: string): { baseType: string; modifiers: TypeModifier[] } {
  const modifiers: TypeModifier[] = [];
  let baseType = typeStr;

  if (baseType.endsWith('[]')) {
    modifiers.push('optional');
    baseType = baseType.slice(0, -2);
  }

  if (baseType.endsWith('?')) {
    modifiers.push('optional');
    baseType = baseType.slice(0, -1);
  }

  if (baseType.endsWith('!')) {
    modifiers.push('nullable');
    baseType = baseType.slice(0, -1);
  }

  return { baseType, modifiers };
}

function parseShorthandValue(typeStr: string): ParsedType {
  const { defaultValue, rest: typeStrAfterDefault } = parseDefault(typeStr);
  const { enumValues, rest: typeStrAfterEnum } = parseEnum(typeStrAfterDefault);
  const { baseType, modifiers } = parseModifiers(typeStrAfterEnum);

  const baseMatch = baseType.match(/^([a-z]+)/);
  const base = baseMatch ? baseMatch[1] : baseType;
  const isArray = baseType.endsWith('[]') || typeStr.includes('[]');

  const constraints = parseConstraints(typeStr, base);

  return {
    baseType: isArray ? `${base}[]` : base,
    modifiers,
    arrayModifier: isArray ? { type: 'array', itemType: base } : undefined,
    constraints,
    defaultValue,
    enumValues,
  };
}

function buildZodFromParsed(parsed: ParsedType): ZodType<any> {
  let schema: ZodType<any>;
  let baseType = parsed.baseType;

  if (parsed.arrayModifier) {
    const itemSchema = buildZodFromParsed({ ...parsed, baseType: parsed.arrayModifier.itemType, arrayModifier: undefined });
    schema = z.array(itemSchema);
    return applyModifiers(schema, parsed.modifiers, parsed.defaultValue);
  }

  switch (baseType) {
    case 'string':
    case 'str':
      schema = z.string();
      if (parsed.constraints.email) schema = (schema as any).email();
      else if (parsed.constraints.url) schema = (schema as any).url();
      else if (parsed.constraints.uuid) schema = (schema as any).uuid();
      else if (parsed.constraints.cuid) schema = (schema as any).cuid();
      else if (parsed.constraints.datetime) schema = (schema as any).datetime();
      else if (parsed.constraints.ip) schema = (schema as any).ip();
      if (parsed.constraints.regex) schema = (schema as any).regex(parsed.constraints.regex);
      if (parsed.constraints.min !== undefined) schema = (schema as any).min(parsed.constraints.min);
      if (parsed.constraints.max !== undefined) schema = (schema as any).max(parsed.constraints.max);
      if (parsed.constraints.length !== undefined) schema = (schema as any).length(parsed.constraints.length);
      if (parsed.constraints.includes) schema = (schema as any).includes(parsed.constraints.includes);
      if (parsed.constraints.startsWith) schema = (schema as any).startsWith(parsed.constraints.startsWith);
      if (parsed.constraints.endsWith) schema = (schema as any).endsWith(parsed.constraints.endsWith);
      break;

    case 'number':
    case 'num':
    case 'float':
      schema = z.number();
      if (parsed.constraints.min !== undefined) schema = (schema as any).min(parsed.constraints.min);
      if (parsed.constraints.max !== undefined) schema = (schema as any).max(parsed.constraints.max);
      if (parsed.constraints.multipleOf) schema = (schema as any).multipleOf(parsed.constraints.multipleOf);
      if (parsed.constraints.positive) schema = (schema as any).positive();
      else if (parsed.constraints.negative) schema = (schema as any).negative();
      else if (parsed.constraints.nonnegative) schema = (schema as any).nonnegative();
      else if (parsed.constraints.nonpositive) schema = (schema as any).nonpositive();
      if (parsed.constraints.int) schema = (schema as any).int();
      break;

    case 'int':
    case 'integer':
      schema = z.number().int();
      if (parsed.constraints.min !== undefined) schema = (schema as any).min(parsed.constraints.min);
      if (parsed.constraints.max !== undefined) schema = (schema as any).max(parsed.constraints.max);
      if (parsed.constraints.multipleOf) schema = (schema as any).multipleOf(parsed.constraints.multipleOf);
      if (parsed.constraints.positive) schema = (schema as any).positive();
      else if (parsed.constraints.negative) schema = (schema as any).negative();
      else if (parsed.constraints.nonnegative) schema = (schema as any).nonnegative();
      else if (parsed.constraints.nonpositive) schema = (schema as any).nonpositive();
      break;

    case 'boolean':
    case 'bool':
      schema = z.boolean();
      break;

    case 'date':
      schema = z.date();
      if (parsed.constraints.min) schema = (schema as any).min(parsed.constraints.min);
      if (parsed.constraints.max) schema = (schema as any).max(parsed.constraints.max);
      break;

    case 'object':
      schema = z.object({});
      break;

    case 'array':
      schema = z.array(z.unknown());
      break;

    case 'any':
      schema = z.any();
      break;

    case 'unknown':
      schema = z.unknown();
      break;

    case 'void':
      schema = z.void();
      break;

    case 'never':
      schema = z.never();
      break;

    case 'undefined':
      schema = z.undefined();
      break;

    case 'null':
      schema = z.null();
      break;

    case 'literal':
      schema = z.literal(parsed.constraints.literal || '');
      break;

    default:
      if (parsed.enumValues) {
        schema = z.enum(parsed.enumValues as [string, ...string[]]);
      } else {
        schema = z.string();
      }
  }

  return applyModifiers(schema, parsed.modifiers, parsed.defaultValue);
}

function applyModifiers(schema: ZodType<any>, modifiers: TypeModifier[], defaultValue?: any): ZodType<any> {
  let result = schema;

  if (modifiers.includes('nullable')) {
    result = z.nullable(result);
  }

  if (modifiers.includes('optional')) {
    result = result.optional();
  }

  if (defaultValue !== undefined) {
    result = result.default(defaultValue);
  }

  return result;
}

export function parseShorthand(value: ShorthandValue): ZodType<any> {
  const parsed = parseShorthandValue(value);
  return buildZodFromParsed(parsed);
}

export function parseShorthandObject(obj: ShorthandObject): ZodObject<any> {
  const shape: Record<string, ZodType<any>> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      shape[key] = parseShorthand(value);
    } else if (isShorthandObject(value)) {
      if (Array.isArray(value)) {
        const [first] = value;
        if (isShorthandObject(first)) {
          shape[key] = z.array(parseShorthandObject(first));
        } else {
          shape[key] = z.array(z.any());
        }
      } else {
        shape[key] = parseShorthandObject(value);
      }
    }
  }

  return z.object(shape);
}

export function maybeParseShorthand(value: any): ZodType<any> | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return parseShorthand(value);
  }

  if (isShorthandObject(value)) {
    return parseShorthandObject(value);
  }

  if (typeof value === 'function' && value._zodMeta) {
    return value._zodMeta;
  }

  return value;
}
