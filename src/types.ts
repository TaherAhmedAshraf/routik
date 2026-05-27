import { ZodType, ZodObject } from 'zod';
import { RequestHandler } from 'express';

export interface RouteMeta {
  summary?: string;
  tags?: string[];
  security?: SecurityRequirement[];
  responses?: Record<string, ResponseSchema>;
}

export interface ResponseSchema {
  description: string;
  schema?: ZodType;
}

export interface SecurityRequirement {
  [scheme: string]: string[];
}

export interface RouterConfig {
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: ServerConfig[];
  securitySchemes?: SecurityScheme[];
}

export interface ServerConfig {
  url: string;
  description?: string;
}

export interface SecurityScheme {
  id: string;
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  in?: string;
  name?: string;
  flows?: Record<string, any>;
}

export interface TypeWrapper {
  _zodMeta: ZodObject<any>;
  _typeInfo?: any;
}

export interface RouteSchema {
  params?: ZodType<any> | TypeWrapper;
  query?: ZodType<any> | TypeWrapper;
  body?: ZodType<any> | TypeWrapper;
  meta?: RouteMeta;
  before?: RequestHandler[];
  after?: RequestHandler[];
}

export type NormalizedRouteSchema = {
  params?: ZodType<any>;
  query?: ZodType<any>;
  body?: ZodType<any>;
  meta?: RouteMeta;
  before?: RequestHandler[];
  after?: RequestHandler[];
};

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export interface RegisteredRoute {
  method: HttpMethod;
  path: string;
  schema?: NormalizedRouteSchema;
  handlers: RequestHandler[];
}

export type SchemaRouteHandler = (req: any, res: any, next: any) => any;

export function isRouteSchema(arg: any): arg is RouteSchema {
  if (!arg || typeof arg !== 'object') return false;
  const keys = Object.keys(arg);
  const validKeys = ['params', 'query', 'body', 'meta', 'before', 'after'];
  return keys.some(k => validKeys.includes(k)) &&
         keys.every(k => validKeys.includes(k));
}

export function isTypeWrapper(arg: any): arg is TypeWrapper {
  return arg && typeof arg === 'object' && '_zodMeta' in arg;
}