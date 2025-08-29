/**
 * Cloudflare Worker API - Todo App Example
 * 
 * This demonstrates a simple REST API using raw D1 (no ORM)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { securityHeaders } from './middleware/security';
import { apiRateLimit } from './middleware/rateLimit';
import { validate } from './middleware/validation';
import { createTodoSchema, updateTodoSchema, todoIdSchema } from './validators/todo';

// TypeScript types for our data
interface Todo {
  id: number;
  text: string;
  completed: number;  // SQLite uses 0/1 for booleans
  created_at: number;
  updated_at: number;
}

// Environment bindings
interface Bindings {
  DB: D1Database;
  ENVIRONMENT?: string; // 'development' | 'production'
}

// Create Hono app with context types
const app = new Hono<{ 
  Bindings: Bindings;
  Variables: {
    validatedBody?: unknown;
    validatedParams?: unknown;
    validatedQuery?: unknown;
  };
}>();

// Configure CORS based on environment
const getCorsOrigins = (env?: string) => {
  // In production, replace with your actual production URL
  if (env === 'production') {
    return [
      'https://web-app-starter-pack.workers.dev',
      'https://your-custom-domain.com', // Add your production domain
    ];
  }
  
  // Development origins
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
  ];
};

// Apply middleware
app.use('*', async (c, next) => {
  // Apply CORS with environment-specific origins
  const corsMiddleware = cors({
    origin: getCorsOrigins(c.env.ENVIRONMENT),
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Security headers
app.use('*', securityHeaders);

// Rate limiting for API routes
app.use('/api/*', apiRateLimit);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Todo API is running'
  });
});

// Get all todos
app.get('/api/todos', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM todos ORDER BY created_at DESC'
    ).all<Todo>();
    
    // Convert SQLite integers to booleans for frontend
    const todos = results.map((todo: Todo) => ({
      ...todo,
      completed: todo.completed === 1
    }));
    
    return c.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return c.json({ error: 'Failed to fetch todos' }, 500);
  }
});

// Get single todo
app.get('/api/todos/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const todo = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE id = ?'
    ).bind(id).first<Todo>();
    
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    
    return c.json({
      ...todo,
      completed: todo.completed === 1
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return c.json({ error: 'Failed to fetch todo' }, 500);
  }
});

// Create todo with validation
app.post('/api/todos', validate.body(createTodoSchema), async (c) => {
  try {
    const body = c.get('validatedBody') as { text: string };
    
    const now = Math.floor(Date.now() / 1000);
    const result = await c.env.DB.prepare(
      'INSERT INTO todos (text, completed, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(body.text, 0, now, now).run();
    
    if (!result.success) {
      throw new Error('Failed to insert todo');
    }
    
    // Return the created todo
    const newTodo = {
      id: result.meta.last_row_id,
      text: body.text,
      completed: false,
      created_at: now,
      updated_at: now
    };
    
    return c.json(newTodo, 201);
  } catch (error) {
    console.error('Error creating todo:', error);
    return c.json({ error: 'Failed to create todo' }, 500);
  }
});

// Update todo with validation
app.put('/api/todos/:id', validate.params(todoIdSchema), validate.body(updateTodoSchema), async (c) => {
  try {
    const { id } = c.get('validatedParams') as { id: number };
    const body = c.get('validatedBody') as { text?: string; completed?: boolean };
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number)[] = [];
    
    if (body.text !== undefined) {
      updates.push('text = ?');
      values.push(body.text);
    }
    
    if (body.completed !== undefined) {
      updates.push('completed = ?');
      values.push(body.completed ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }
    
    // Always update the timestamp
    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    
    // Add the ID at the end for the WHERE clause
    values.push(id);
    
    const result = await c.env.DB.prepare(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    
    // Fetch and return the updated todo
    const updated = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE id = ?'
    ).bind(id).first<Todo>();
    
    return c.json({
      ...updated,
      completed: updated!.completed === 1
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    return c.json({ error: 'Failed to update todo' }, 500);
  }
});

// Delete todo
app.delete('/api/todos/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const result = await c.env.DB.prepare(
      'DELETE FROM todos WHERE id = ?'
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    
    return c.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return c.json({ error: 'Failed to delete todo' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;