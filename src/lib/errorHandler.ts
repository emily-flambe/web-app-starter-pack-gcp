import { logger } from './logger';

/**
 * Global error handler for unhandled errors
 * Catches and logs errors that occur outside of React components
 */

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise,
  });

  // Prevent the default browser behavior (console error)
  event.preventDefault();
});

// Handle global errors
window.addEventListener('error', (event) => {
  logger.error('Global error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });

  // Prevent the default browser behavior (console error)
  event.preventDefault();
});

// Export a function to manually report errors
export function reportError(error: Error, context?: Record<string, unknown>) {
  logger.error('Manual error report', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}
