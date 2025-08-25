// Centralized error handling utility
interface ErrorWithRetry extends Error {
  shouldRetry?: boolean;
  retryCount?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public shouldRetry: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleSupabaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Handle common Supabase errors with user-friendly messages
  if (error.code === 'PGRST301') {
    return 'You do not have permission to perform this action';
  }
  
  if (error.code === 'PGRST116') {
    return 'The requested resource was not found';
  }
  
  if (error.code === '23505') {
    return 'This record already exists. Please check for duplicates.';
  }
  
  if (error.code === '23503') {
    return 'This action would violate data integrity constraints';
  }
  
  // Handle constraint violation errors specifically
  if (error.message?.includes('duplicate key value violates unique constraint')) {
    return 'A record with these details already exists. Please check for duplicates.';
  }
  
  if (error.message?.includes('no unique or exclusion constraint')) {
    return 'Database configuration issue. Please try again or contact support.';
  }
  
  if (error.message?.includes('violates foreign key constraint')) {
    return 'Referenced data not found. Please ensure all required data exists.';
  }
  
  if (error.message?.includes('JWT')) {
    return 'Your session has expired. Please log in again';
  }
  
  if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again';
  }

  // Handle RPC function errors
  if (error.message?.includes('function') && error.message?.includes('does not exist')) {
    return 'Database function not available. Please contact support.';
  }

  return error.message || 'An unexpected error occurred';
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  defaultValue: R,
  errorHandler?: (error: Error) => void
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as Error;
      if (errorHandler) {
        errorHandler(err);
      }
      return defaultValue;
    }
  };
};
