import { useState, useEffect } from 'react';
import { apiClient, type Todo } from './lib/api/client';
import { logger } from './lib/logger';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load todos on mount
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getTodos();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos. Make sure the backend is running!');
      logger.error('Error loading todos', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      setError(null);
      const newTodo = await apiClient.createTodo(newTodoText);
      setTodos([...todos, newTodo]);
      setNewTodoText('');
    } catch (err) {
      setError('Failed to add todo');
      logger.error('Error adding todo', { error: String(err) });
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      setError(null);
      const updated = await apiClient.toggleTodo(id, !completed);
      setTodos(todos.map((todo) => (todo.id === id ? updated : todo)));
    } catch (err) {
      setError('Failed to update todo');
      logger.error('Error toggling todo', { error: String(err) });
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      setError(null);
      await apiClient.deleteTodo(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      logger.error('Error deleting todo', { error: String(err) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            Todo App Example
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Frontend (React) ↔ Backend (Cloudflare Worker) ↔ Database (D1)
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-400 bg-red-100 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newTodoText.trim()}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Todo
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No todos yet. Add one above!</p>
              <p className="mt-2 text-sm">
                Make sure to run{' '}
                <code className="rounded bg-gray-200 px-2 py-1 dark:bg-gray-800">wrangler dev</code>{' '}
                for the backend
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="h-5 w-5 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? 'text-gray-500 line-through dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="rounded px-3 py-1 text-red-600 transition-colors hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            How This Works
          </h2>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              1. Frontend (this React app) makes API calls using{' '}
              <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">
                src/lib/api/client.ts
              </code>
            </li>
            <li>
              2. API calls go to the backend at{' '}
              <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">
                http://localhost:8787/api/todos
              </code>
            </li>
            <li>
              3. Backend (Cloudflare Worker) handles requests in{' '}
              <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">worker/index.ts</code>
            </li>
            <li>4. Data is stored in D1 database using raw SQL queries</li>
          </ol>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Run <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">npm run dev</code> and{' '}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">wrangler dev</code> to start
            both servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
