import { MiddlewareHandler } from 'hono';
import { z, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, params, or query against a Zod schema
 */
export const validate = {
  body: <T extends z.ZodSchema>(schema: T): MiddlewareHandler => {
    return async (c, next) => {
      try {
        const body = await c.req.json();
        const validated = schema.parse(body);
        c.set('validatedBody', validated);
        await next();
      } catch (error) {
        if (error instanceof ZodError) {
          return c.json({
            error: 'Validation failed',
            details: error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          }, 400);
        }
        return c.json({ error: 'Invalid request body' }, 400);
      }
    };
  },

  params: <T extends z.ZodSchema>(schema: T): MiddlewareHandler => {
    return async (c, next) => {
      try {
        const params = c.req.param();
        const validated = schema.parse(params);
        c.set('validatedParams', validated);
        await next();
      } catch (error) {
        if (error instanceof ZodError) {
          return c.json({
            error: 'Invalid parameters',
            details: error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          }, 400);
        }
        return c.json({ error: 'Invalid parameters' }, 400);
      }
    };
  },

  query: <T extends z.ZodSchema>(schema: T): MiddlewareHandler => {
    return async (c, next) => {
      try {
        const query = c.req.query();
        const validated = schema.parse(query);
        c.set('validatedQuery', validated);
        await next();
      } catch (error) {
        if (error instanceof ZodError) {
          return c.json({
            error: 'Invalid query parameters',
            details: error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          }, 400);
        }
        return c.json({ error: 'Invalid query parameters' }, 400);
      }
    };
  },
};