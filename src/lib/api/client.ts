/**
 * API Client for backend communication
 *
 * This example shows how to communicate with the Cloudflare Worker backend
 */

// Todo type matching backend schema
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    // In production, the API is served from the same domain
    // In development, use the local Wrangler server
    // NOTE: Don't use .env.local for production builds!
    if (import.meta.env.VITE_API_URL && !import.meta.env.PROD) {
      // Use VITE_API_URL only in development
      this.baseUrl = import.meta.env.VITE_API_URL;
    } else if (import.meta.env.PROD) {
      // In production, use relative URLs (same domain)
      this.baseUrl = '';
    } else {
      // Fallback for local development
      this.baseUrl = 'http://localhost:8787';
    }

    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle API responses
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  /**
   * Health check endpoint
   */
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      headers: this.headers,
    });
    return this.handleResponse(response);
  }

  // ============================================
  // Todo CRUD Operations - Example Implementation
  // ============================================

  /**
   * Get all todos
   */
  async getTodos(): Promise<Todo[]> {
    const response = await fetch(`${this.baseUrl}/api/todos`, {
      headers: this.headers,
    });
    return this.handleResponse<Todo[]>(response);
  }

  /**
   * Get single todo
   */
  async getTodo(id: number): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/todos/${id}`, {
      headers: this.headers,
    });
    return this.handleResponse<Todo>(response);
  }

  /**
   * Create a new todo
   */
  async createTodo(text: string): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/todos`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ text }),
    });
    return this.handleResponse<Todo>(response);
  }

  /**
   * Update a todo
   */
  async updateTodo(id: number, updates: { text?: string; completed?: boolean }): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/todos/${id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(updates),
    });
    return this.handleResponse<Todo>(response);
  }

  /**
   * Delete a todo
   */
  async deleteTodo(id: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/todos/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    return this.handleResponse<{ message: string }>(response);
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodo(id: number, completed: boolean): Promise<Todo> {
    return this.updateTodo(id, { completed });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
