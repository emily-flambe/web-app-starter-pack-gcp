/**
 * Integration test example for API Client
 *
 * This demonstrates how to test API interactions using MSW (Mock Service Worker)
 * for intercepting and mocking HTTP requests during tests.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Define mock todo data
const mockTodos = [
  { id: 1, text: 'Test todo 1', completed: false },
  { id: 2, text: 'Test todo 2', completed: true },
];

// Setup MSW server with handlers
const server = setupServer(
  // Mock GET /api/todos
  http.get('http://localhost:8787/api/todos', () => {
    return HttpResponse.json(mockTodos);
  }),

  // Mock POST /api/todos
  http.post('http://localhost:8787/api/todos', async (info) => {
    const body = (await info.request.json()) as { text: string };
    const newTodo = {
      id: 3,
      text: body.text,
      completed: false,
    };
    return HttpResponse.json(newTodo, { status: 201 });
  }),

  // Mock PUT /api/todos/:id
  http.put('http://localhost:8787/api/todos/:id', async (info) => {
    const id = Number(info.params.id);
    const body = (await info.request.json()) as {
      text?: string;
      completed?: boolean;
    };
    const todo = mockTodos.find((t) => t.id === id);

    if (!todo) {
      return new HttpResponse(null, { status: 404 });
    }

    const updatedTodo = { ...todo, ...body };
    return HttpResponse.json(updatedTodo);
  }),

  // Mock DELETE /api/todos/:id
  http.delete('http://localhost:8787/api/todos/:id', (info) => {
    const id = Number(info.params.id);
    const todo = mockTodos.find((t) => t.id === id);

    if (!todo) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Mock health check
  http.get('http://localhost:8787/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Todo API is running',
    });
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

describe('API Client Integration', () => {
  // These tests use MSW to mock HTTP responses, allowing us to test
  // API interactions without needing a running backend server.

  describe('Health Check', () => {
    it('should successfully check API health', async () => {
      const response = await fetch('http://localhost:8787/api/health');
      const data = (await response.json()) as {
        status: string;
        message: string;
        timestamp: string;
      };

      expect(response.ok).toBe(true);
      expect(data.status).toBe('ok');
      expect(data.message).toBe('Todo API is running');
    });
  });

  describe('Todo Operations', () => {
    it('should fetch all todos', async () => {
      const response = await fetch('http://localhost:8787/api/todos');
      const todos = (await response.json()) as Array<{
        id: number;
        text: string;
        completed: boolean;
      }>;

      expect(response.ok).toBe(true);
      expect(todos).toHaveLength(2);
      expect(todos[0].text).toBe('Test todo 1');
    });

    it('should create a new todo', async () => {
      const response = await fetch('http://localhost:8787/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'New todo' }),
      });
      const todo = (await response.json()) as {
        id: number;
        text: string;
        completed: boolean;
      };

      expect(response.status).toBe(201);
      expect(todo.text).toBe('New todo');
      expect(todo.completed).toBe(false);
    });

    it('should update an existing todo', async () => {
      const response = await fetch('http://localhost:8787/api/todos/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      const todo = (await response.json()) as {
        id: number;
        text: string;
        completed: boolean;
      };

      expect(response.ok).toBe(true);
      expect(todo.id).toBe(1);
      expect(todo.completed).toBe(true);
    });

    it('should delete a todo', async () => {
      const response = await fetch('http://localhost:8787/api/todos/1', {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await fetch('http://localhost:8787/api/todos/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Override the handler to simulate a network error
      server.use(
        http.get('http://localhost:8787/api/todos', () => {
          return HttpResponse.error();
        })
      );

      try {
        await fetch('http://localhost:8787/api/todos');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle 500 server errors', async () => {
      // Override the handler to return a 500 error
      server.use(
        http.get('http://localhost:8787/api/todos', () => {
          return new HttpResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
          });
        })
      );

      const response = await fetch('http://localhost:8787/api/todos');
      expect(response.status).toBe(500);
    });
  });
});
