/**
 * Structured logger for production-ready applications
 * In production, this would send to services like Sentry, DataDog, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use console methods
    if (this.isDevelopment) {
      const consoleMethod = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      }[level];

      consoleMethod(`[${level.toUpperCase()}]`, message, context || '');
    }

    // In production, send to external service
    if (this.isProduction) {
      // TODO: Integrate with your preferred logging service
      // Examples:
      // - Sentry.captureMessage(message, level);
      // - dataDogLogs.logger.log(message, context, level);
      // - customLogEndpoint.send(logEntry);

      // For now, we'll store in a buffer that could be sent in batches
      this.buffer.push(logEntry);
      if (this.buffer.length >= this.bufferSize) {
        this.flush();
      }
    }
  }

  private buffer: LogEntry[] = [];
  private bufferSize = 10;

  private flush() {
    if (this.buffer.length === 0) return;

    // In a real app, this would send logs to your logging service
    // For now, we'll just clear the buffer
    if (this.isProduction) {
      // TODO: Send buffer to logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(this.buffer)
      // });
    }

    this.buffer = [];
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  // Track user actions for analytics
  track(event: string, properties?: Record<string, unknown>) {
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      this.info('Analytics Event', { event, properties });
      // TODO: Send to analytics service
      // analytics.track(event, properties);
    }
  }

  // Performance monitoring
  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    this.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
  }
}

export const logger = new Logger();
