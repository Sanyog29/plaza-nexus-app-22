import React from 'react';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: any;
  component?: string;
  userId?: string;
}

interface ErrorLoggerOptions {
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  maxLogs?: number;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private options: ErrorLoggerOptions;

  constructor(options: ErrorLoggerOptions = {}) {
    this.options = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      maxLogs: 100,
      ...options
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level: 'error' | 'warn' | 'info', message: string, context?: any) {
    const logEntry: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      context,
      component: context?.component,
      userId: context?.userId
    };

    // Add to internal logs
    this.logs.unshift(logEntry);
    
    // Keep only the latest logs
    if (this.logs.length > (this.options.maxLogs || 100)) {
      this.logs = this.logs.slice(0, this.options.maxLogs);
    }

    // Console logging
    if (this.options.enableConsoleLogging) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : console.log;
      
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context);
    }

    // Remote logging (could be sent to external service)
    if (this.options.enableRemoteLogging) {
      this.sendToRemoteService(logEntry);
    }
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getErrorSummary() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => log.timestamp >= last24Hours);
    
    return {
      total: this.logs.length,
      last24Hours: recentLogs.length,
      errors: recentLogs.filter(log => log.level === 'error').length,
      warnings: recentLogs.filter(log => log.level === 'warn').length,
      mostCommonErrors: this.getMostCommonErrors(recentLogs),
      componentErrors: this.getComponentErrors(recentLogs)
    };
  }

  private getMostCommonErrors(logs: ErrorLog[]) {
    const errorCount: { [key: string]: number } = {};
    
    logs.filter(log => log.level === 'error').forEach(log => {
      const key = log.message.substring(0, 100); // First 100 chars as key
      errorCount[key] = (errorCount[key] || 0) + 1;
    });

    return Object.entries(errorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  private getComponentErrors(logs: ErrorLog[]) {
    const componentCount: { [key: string]: number } = {};
    
    logs.filter(log => log.component).forEach(log => {
      componentCount[log.component!] = (componentCount[log.component!] || 0) + 1;
    });

    return Object.entries(componentCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));
  }

  private async sendToRemoteService(logEntry: ErrorLog) {
    try {
      // This would typically send to a logging service like LogRocket, Sentry, etc.
      // For now, we'll just store locally or send to a custom endpoint
      
      // Example implementation:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
      
      console.info('Log would be sent to remote service:', logEntry);
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  clearLogs() {
    this.logs = [];
  }
}

// Global logger instance
export const logger = new ErrorLogger({
  enableConsoleLogging: true,
  enableRemoteLogging: false, // Enable when you have a logging service
  maxLogs: 200
});

// React hook for using the logger
export const useErrorLogger = () => {
  const [summary, setSummary] = React.useState(logger.getErrorSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSummary(logger.getErrorSummary());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    logger,
    summary,
    logs: logger.getLogs(),
    refreshSummary: () => setSummary(logger.getErrorSummary())
  };
};

// Error boundary component with enhanced logging
interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EnhancedErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to our centralized logger
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      component: 'ErrorBoundary'
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          resetError: this.resetError
        });
      }

      return React.createElement('div', {
        className: "min-h-[200px] flex items-center justify-center p-6"
      }, React.createElement('div', {
        className: "text-center space-y-4"
      }, [
        React.createElement('h3', {
          key: 'title',
          className: "text-lg font-semibold text-destructive"
        }, 'Something went wrong'),
        React.createElement('p', {
          key: 'description',
          className: "text-sm text-muted-foreground max-w-md"
        }, 'An unexpected error occurred. The error has been logged and will be reviewed.'),
        React.createElement('button', {
          key: 'button',
          onClick: this.resetError,
          className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        }, 'Try Again')
      ]));
    }

    return this.props.children;
  }
}
