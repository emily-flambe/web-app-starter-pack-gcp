import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to external service in production
    logger.error('React Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can customize this fallback UI
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md rounded-lg bg-white px-6 py-8 shadow-lg dark:bg-gray-800">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Something went wrong
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  We're sorry for the inconvenience. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Refresh Page
                </button>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
