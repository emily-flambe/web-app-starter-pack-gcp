import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../App';

// Mock the API client
vi.mock('../../lib/api/client', () => ({
  apiClient: {
    getTodos: vi.fn(() => Promise.resolve([])),
    createTodo: vi.fn(),
    toggleTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
  type: {},
}));

describe('App', () => {
  it('renders the heading', async () => {
    render(<App />);
    const heading = screen.getByText(/Todo App Example/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders the description', async () => {
    render(<App />);
    const description = screen.getByText(/Frontend \(React\) ↔ Backend/i);
    expect(description).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<App />);
    const loading = screen.getByText(/Loading todos/i);
    expect(loading).toBeInTheDocument();
  });

  it('renders the add todo form', async () => {
    render(<App />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Add a new todo/i);
      expect(input).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Add Todo/i });
    expect(button).toBeInTheDocument();
  });
});
