import { z } from 'zod';

// Todo validation schemas
export const createTodoSchema = z.object({
  text: z.string()
    .min(1, 'Todo text is required')
    .max(500, 'Todo text must be less than 500 characters')
    .trim(),
});

export const updateTodoSchema = z.object({
  text: z.string()
    .min(1, 'Todo text is required')
    .max(500, 'Todo text must be less than 500 characters')
    .trim()
    .optional(),
  completed: z.boolean().optional(),
});

export const todoIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid todo ID').transform(Number),
});

// Type exports
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoIdParam = z.infer<typeof todoIdSchema>;