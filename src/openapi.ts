import { zodToJsonSchema } from 'zod-to-json-schema';
import { ZodObject, ZodType } from 'zod';
import {
  RouterConfig,
  RegisteredRoute,
  RouteMeta,
  SecurityScheme,
} from './types';

interface JsonSchema {
  [key: string]: any;
}

export class OpenApiBuilder {
  private config: RouterConfig;
  private routes: RegisteredRoute[] = [];

  constructor(config: RouterConfig = {}) {
    this.config = config;
  }

  addRoute(route: RegisteredRoute): void {
    this.routes.push(route);
  }

  getRoutes(): RegisteredRoute[] {
    return [...this.routes];
  }

  mergeFrom(otherPaths: JsonSchema, basePath: string = ''): void {
    if (!otherPaths) return;

    const prefix = basePath.replace(/\/$/, '');

    for (const [path, methods] of Object.entries(otherPaths)) {
      if (!path) continue;

      for (const [method, operation] of Object.entries(methods as JsonSchema)) {
        if (method === 'parameters') continue;

        const fullPath = path === '/' ? (prefix || '/') : prefix + path;
        const op = operation as JsonSchema;

        this.routes.push({
          method: method as any,
          path: fullPath,
          schema: {
            meta: {
              summary: op.summary,
              tags: op.tags,
              responses: op.responses,
            },
            body: op.requestBody?.content?.['application/json']?.schema,
            query: op.parameters?.filter((p: any) => p.in === 'query')?.reduce((acc: any, p: any) => {
              acc.properties = acc.properties || {};
              acc.properties[p.name] = p.schema;
              if (p.required) acc.required = acc.required || [];
              if (p.required) acc.required.push(p.name);
              return acc;
            }, { type: 'object' }),
          },
          handlers: [],
        });
      }
    }
  }

  private convertSchema(schema: ZodType<any>): JsonSchema {
    return zodToJsonSchema(schema as any, { target: 'openApi3' }) as JsonSchema;
  }

  private buildPathParameters(paramsSchema: ZodType<any> | undefined, path: string): JsonSchema[] {
    if (!paramsSchema) return [];

    const paramNamesInPath = (path.match(/:\w+/g) || []).map(p => p.slice(1));
    const schemaObj = this.convertSchema(paramsSchema);
    const params = schemaObj.properties || {};

    return paramNamesInPath.map(name => ({
      name,
      in: 'path' as const,
      required: true,
      schema: params[name] || { type: 'string' },
    }));
  }

  private buildRequestBody(bodySchema: ZodType<any> | undefined): JsonSchema | undefined {
    if (!bodySchema) return undefined;

    const schema = bodySchema instanceof ZodType 
      ? this.convertSchema(bodySchema) 
      : bodySchema;
    return {
      content: {
        'application/json': {
          schema,
        },
      },
    };
  }

  private buildResponses(responses: RouteMeta['responses']): JsonSchema {
    const result: JsonSchema = {};
    if (!responses) return result;

    for (const [code, response] of Object.entries(responses)) {
      result[code] = {
        description: response.description,
        content: response.schema
          ? {
              'application/json': {
                schema: this.convertSchema(response.schema as ZodType<any>),
              },
            }
          : undefined,
      };
    }
    return result;
  }

  private buildSecurity(scheme: SecurityScheme): JsonSchema {
    switch (scheme.type) {
      case 'http':
        return { type: 'http', scheme: scheme.scheme };
      case 'apiKey':
        return { type: 'apiKey', in: scheme.in, name: scheme.name };
      case 'oauth2':
        return { type: 'oauth2', flows: scheme.flows };
      default:
        return {};
    }
  }

  private expressPathToOpenApi(path: string): string {
    return path.replace(/:(\w+)/g, '{$1}');
  }

  build(): JsonSchema {
    const info = {
      title: this.config.info?.title || 'API',
      version: this.config.info?.version || '1.0.0',
      description: this.config.info?.description,
    };

    const paths: JsonSchema = {};

    for (const route of this.routes) {
      const { method, path, schema } = route;
      const routeMeta = schema?.meta || {};
      const openApiPath = this.expressPathToOpenApi(path);

      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }

      const operation: JsonSchema = {
        responses: this.buildResponses(routeMeta.responses),
      };

      if (routeMeta.summary) {
        operation.summary = routeMeta.summary;
      }
      if (routeMeta.tags) {
        operation.tags = routeMeta.tags;
      }
      if (routeMeta.security) {
        operation.security = routeMeta.security;
      }

      const pathParams = this.buildPathParameters(schema?.params, path);
      if (pathParams.length > 0) {
        operation.parameters = pathParams;
      }

      const requestBody = this.buildRequestBody(schema?.body);
      if (requestBody) {
        operation.requestBody = requestBody;
      }

      let querySchema: JsonSchema | undefined;
      if (schema?.query) {
        if (schema.query instanceof ZodType) {
          querySchema = this.convertSchema(schema.query);
        } else if (typeof schema.query === 'object' && (schema.query as any)._def) {
          querySchema = this.convertSchema(schema.query as ZodType<any>);
        } else if (typeof schema.query === 'object') {
          querySchema = schema.query as JsonSchema;
        }
      }
      if (querySchema && querySchema.properties) {
        const queryParams = Object.entries(querySchema.properties).map(([name, schema]) => ({
          name,
          in: 'query' as const,
          required: !querySchema.required?.includes(name),
          schema,
        }));
        operation.parameters = [...(operation.parameters || []), ...queryParams];
      } else if (schema?.query && typeof schema.query === 'object' && !schema.query._def) {
        const q = schema.query as any;
        if (q.properties) {
          const queryParams = Object.entries(q.properties).map(([name, s]: [string, any]) => ({
            name,
            in: 'query' as const,
            required: q.required?.includes(name),
            schema: s,
          }));
          operation.parameters = [...(operation.parameters || []), ...queryParams];
        }
      }

      paths[openApiPath][method] = operation;
    }

    const securitySchemes: JsonSchema = {};
    if (this.config.securitySchemes) {
      for (const scheme of this.config.securitySchemes) {
        securitySchemes[scheme.id] = this.buildSecurity(scheme);
      }
    }

    const spec: JsonSchema = {
      openapi: '3.1.0',
      info,
      paths,
    };

    if (this.config.servers?.length) {
      spec.servers = this.config.servers;
    }

    if (Object.keys(securitySchemes).length > 0) {
      spec.components = { securitySchemes };
    }

    return spec;
  }
}