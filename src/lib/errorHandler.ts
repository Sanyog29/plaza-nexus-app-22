import { toast } from '@/hooks/use-toast';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  originalError?: Error;
}

export class AppErrorHandler {
  private static logError(error: AppError) {
    // SECURITY: Sanitize context to avoid logging sensitive data
    const sanitizedContext = error.context ? 
      Object.fromEntries(
        Object.entries(error.context).filter(([key]) => 
          !['password', 'token', 'apiKey', 'secret', 'authorization'].includes(key.toLowerCase())
        )
      ) : undefined;

    const logData = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('[AppError]', logData);
      // Log original error separately (may contain stack trace)
      if (error.originalError) {
        console.error('[Original Error]', error.originalError.message);
      }
    }
  }

  static handle(error: AppError) {
    this.logError(error);

    // Show user-friendly toast based on severity
    switch (error.severity) {
      case 'critical':
        toast({
          title: 'System Error',
          description: 'A critical error occurred. Please refresh and try again.',
          variant: 'destructive',
        });
        break;
      case 'high':
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        break;
      case 'medium':
        toast({
          title: 'Warning',
          description: error.message,
          variant: 'default',
        });
        break;
      case 'low':
        // Log only, no user notification
        break;
    }
  }

  static handleSupabaseError(error: any, context?: Record<string, any>): AppError {
    const appError: AppError = {
      message: this.getSupabaseErrorMessage(error),
      code: error.code,
      severity: this.getSupabaseErrorSeverity(error),
      context: { ...context, supabaseError: error },
      originalError: error,
    };

    this.handle(appError);
    return appError;
  }

  private static getSupabaseErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.details) return error.details;
    if (error.hint) return error.hint;
    return 'An unexpected database error occurred';
  }

  private static getSupabaseErrorSeverity(error: any): ErrorSeverity {
    // Network errors are critical
    if (!error.code) return 'critical';
    
    // Authentication errors
    if (error.code?.startsWith('42')) return 'high';
    
    // Permission errors
    if (error.code === 'PGRST301') return 'medium';
    
    // Not found errors are usually low severity
    if (error.code === 'PGRST116') return 'low';
    
    return 'medium';
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error: any) {
      this.handleSupabaseError(error, context);
      return null;
    }
  }
}

// Convenience functions
export const handleError = (error: AppError) => AppErrorHandler.handle(error);
export const handleSupabaseError = (error: any, context?: Record<string, any>) => 
  AppErrorHandler.handleSupabaseError(error, context);
export const withErrorHandling = <T>(operation: () => Promise<T>, context?: Record<string, any>) => 
  AppErrorHandler.withErrorHandling(operation, context);