/**
 * ## routik
 *
 * Express router wrapper with built-in Zod validation and automatic OpenAPI 3.x documentation generation.
 *
 * ### Quick start
 * ```ts
 * import express from 'express';
 * import { createRouter } from 'routik';
 *
 * const app = express();
 * app.use(express.json());
 *
 * const router = createRouter({
 *   info: { title: 'My API', version: '1.0.0' }
 * });
 *
 * router.get('/hello', { meta: { summary: 'Say hello' } }, (req, res) => {
 *   res.json({ message: 'Hello' });
 * });
 *
 * app.use(router.getRouter());
 * router.mountDocs('/docs', app);
 * ```
 *
 * @module routik
 */

export { ZodRouter, createRouter } from "./router";
export { createValidatorMiddleware, normalizeSchema } from "./validator";
export { OpenApiBuilder } from "./openapi";
export {
  RouterConfig,
  RouteSchema,
  RouteMeta,
  RegisteredRoute,
  HttpMethod,
  SecurityScheme,
  SecurityRequirement,
  ServerConfig,
  ShorthandObject,
  TypeWrapper,
  isRouteSchema,
  isShorthandObject,
  isTypeWrapper,
} from "./types";
export {
  parseShorthand,
  parseShorthandObject,
  maybeParseShorthand,
  isShorthandObject as isShorthandValue,
} from "./shorthand";
export {
  Type,
  createSchema,
  String,
  Email,
  Url,
  Uuid,
  Regex,
  Number,
  Int,
  Positive,
  Negative,
  Boolean,
  DateTime,
  Enum,
  Literal,
  Optional,
  Nullable,
  Array,
  Union,
  Obj,
  Record,
  Json,
  Any,
  Never,
  Void,
  Undefined,
  Custom,
  SchemaDefinition,
} from "./infer";
