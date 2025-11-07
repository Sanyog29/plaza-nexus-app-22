import { toast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  originalError?: Error;
  retryable?: boolean;
  details?: string;
}

/**
 * Unified Error Handler for all application errors
 * Consolidates general app errors, Supabase errors, and domain-specific errors
 */
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
      if (error.originalError) {
        console.error('[Original Error]', error.originalError);
      }
    }
  }

  static handle(error: AppError, options: { showToast?: boolean } = {}) {
    const { showToast = true } = options;
    
    this.logError(error);

    if (!showToast) return;

    // Show user-friendly toast based on severity
    const variant = error.severity === 'high' || error.severity === 'critical' 
      ? 'destructive' 
      : 'default';

    switch (error.severity) {
      case 'critical':
        toast({
          title: 'System Error',
          description: error.details || 'A critical error occurred. Please refresh and try again.',
          variant: 'destructive',
        });
        break;
      case 'high':
      case 'medium':
        toast({
          title: error.message,
          description: error.details,
          variant,
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
      retryable: this.isRetryableError(error),
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

  private static isRetryableError(error: any): boolean {
    const retryablePatterns = [
      /network|fetch.*failed|ECONNREFUSED|timeout/i,
      /connection.*timeout|timed out/i,
      /version.*mismatch|concurrent update/i,
    ];
    
    const errorMessage = error.message || '';
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    options: {
      context?: Record<string, any>;
      showToast?: boolean;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<T | null> {
    const { context, showToast = true, onError } = options;
    
    try {
      return await operation();
    } catch (error: any) {
      const appError = this.handleSupabaseError(error, context);
      
      if (!showToast) {
        this.logError(appError);
      }
      
      if (onError) {
        onError(appError);
      }
      
      return null;
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      showToast?: boolean;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<T | null> {
    const { maxRetries = 3, initialDelay = 1000, showToast = true, onError } = options;
    let lastError: AppError | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = this.handleSupabaseError(error, { attempt });
        
        // Don't retry if error is not retryable or max retries reached
        if (!lastError.retryable || attempt === maxRetries) {
          if (showToast) {
            this.handle(lastError);
          }
          
          if (onError) {
            onError(lastError);
          }
          
          return null;
        }
        
        // Exponential backoff with jitter
        const delay = initialDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.3 * delay;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay + jitter)}ms`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    return null;
  }
}

// Convenience functions
export const handleError = (error: AppError, options?: { showToast?: boolean }) => 
  AppErrorHandler.handle(error, options);

export const handleSupabaseError = (error: any, context?: Record<string, any>) => 
  AppErrorHandler.handleSupabaseError(error, context);

export const withErrorHandling = <T>(
  operation: () => Promise<T>, 
  options?: { context?: Record<string, any>; showToast?: boolean; onError?: (error: AppError) => void }
) => AppErrorHandler.withErrorHandling(operation, options);

export const withRetry = <T>(
  operation: () => Promise<T>,
  options?: { maxRetries?: number; initialDelay?: number; showToast?: boolean; onError?: (error: AppError) => void }
) => AppErrorHandler.withRetry(operation, options);