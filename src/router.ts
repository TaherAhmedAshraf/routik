import express, { Router, RequestHandler, Request, Response, Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { OpenApiBuilder } from './openapi';
import { createValidatorMiddleware, normalizeSchema } from './validator';
import { RouterConfig, RouteSchema, RegisteredRoute, HttpMethod, isRouteSchema } from './types';

export class ZodRouter {
  private router: Router;
  private openApiBuilder: OpenApiBuilder;
  private config: RouterConfig;
  private globalMiddlewares: RequestHandler[];

  constructor(config: RouterConfig = {}) {
    this.router = Router();
    this.config = config;
    this.openApiBuilder = new OpenApiBuilder(config);
    this.globalMiddlewares = [];
  }

  use(path: string, subRouter: ZodRouter): void;
  use(...handlers: RequestHandler[]): void;
  use(...args: any[]): void {
    if (typeof args[0] === 'string' && args[1] instanceof ZodRouter) {
      const [path, subRouter] = args;
      this.router.use(path, subRouter.getRouter());
      const subSpec = subRouter.getSpec() as { paths?: any };
      this.openApiBuilder.mergeFrom(subSpec.paths || {}, path);
    } else {
      this.router.use(...args);
    }
  }

  useGlobal(handlers: RequestHandler[]): void {
    this.globalMiddlewares.push(...handlers);
  }

  private registerRoute(method: HttpMethod, path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    let schema: RouteSchema | undefined;
    let routeHandlers: RequestHandler[];

    if (isRouteSchema(schemaOrHandler)) {
      schema = schemaOrHandler;
      routeHandlers = handlers;
    } else {
      routeHandlers = [schemaOrHandler, ...handlers];
    }

    const validationMiddleware = schema ? createValidatorMiddleware(schema) : null;
    const middlewaresToApply = [...this.globalMiddlewares];

    if (schema?.before) {
      middlewaresToApply.push(...schema.before);
    }

    if (validationMiddleware) {
      middlewaresToApply.push(validationMiddleware);
    }

    if (schema?.after) {
      middlewaresToApply.push(...schema.after);
    }

    middlewaresToApply.push(...routeHandlers);

    (this.router as any)[method](path, ...middlewaresToApply);

    if (schema) {
      const normalizedSchema = normalizeSchema(schema);
      this.openApiBuilder.addRoute({
        method,
        path,
        schema: normalizedSchema,
        handlers: routeHandlers,
      });
    }
  }

  get(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('get', path, schemaOrHandler, ...handlers);
  }

  post(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('post', path, schemaOrHandler, ...handlers);
  }

  put(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('put', path, schemaOrHandler, ...handlers);
  }

  patch(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('patch', path, schemaOrHandler, ...handlers);
  }

  delete(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('delete', path, schemaOrHandler, ...handlers);
  }

  head(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('head', path, schemaOrHandler, ...handlers);
  }

  options(path: string, schemaOrHandler: RouteSchema | RequestHandler, ...handlers: RequestHandler[]): void {
    this.registerRoute('options', path, schemaOrHandler, ...handlers);
  }

  getSpec(): object {
    return this.openApiBuilder.build();
  }

  mountDocs(path: string, app: Application): void {
    app.use(path, swaggerUi.serve, swaggerUi.setup(this.getSpec()));
  }

  getRouter(): Router {
    return this.router;
  }
}

export function createRouter(config?: RouterConfig): ZodRouter {
  return new ZodRouter(config);
}