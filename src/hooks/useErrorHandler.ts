import { useCallback } from 'react';
import { AppErrorHandler, AppError } from '@/lib/errorHandler';

export const useErrorHandler = () => {
  const handleError = useCallback((error: AppError) => {
    AppErrorHandler.handle(error);
  }, []);

  const handleSupabaseError = useCallback((error: any, context?: Record<string, any>) => {
    return AppErrorHandler.handleSupabaseError(error, context);
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    return AppErrorHandler.withErrorHandling(operation, context);
  }, []);

  return {
    handleError,
    handleSupabaseError,
    withErrorHandling,
  };
};