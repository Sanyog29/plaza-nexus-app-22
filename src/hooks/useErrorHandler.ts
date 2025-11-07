import { useCallback } from 'react';
import { AppErrorHandler, AppError } from '@/lib/errorHandler';

/**
 * Unified error handler hook
 * Use this for all error handling needs across the application
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: AppError, options?: { showToast?: boolean }) => {
    AppErrorHandler.handle(error, options);
  }, []);

  const handleSupabaseError = useCallback((error: any, context?: Record<string, any>) => {
    return AppErrorHandler.handleSupabaseError(error, context);
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      context?: Record<string, any>;
      showToast?: boolean;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> => {
    return AppErrorHandler.withErrorHandling(operation, options);
  }, []);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      initialDelay?: number;
      showToast?: boolean;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> => {
    return AppErrorHandler.withRetry(operation, options);
  }, []);

  return {
    handleError,
    handleSupabaseError,
    withErrorHandling,
    withRetry,
  };
};