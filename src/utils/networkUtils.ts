import { supabase } from '@/integrations/supabase/client';

export interface ConnectivityCheckResult {
  isOnline: boolean;
  supabaseReachable: boolean;
  error?: string;
}

export const checkConnectivity = async (timeout = 5000): Promise<ConnectivityCheckResult> => {
  const result: ConnectivityCheckResult = {
    isOnline: navigator.onLine,
    supabaseReachable: false,
  };

  if (!result.isOnline) {
    result.error = 'No internet connection detected';
    return result;
  }

  try {
    // Test Supabase connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const { error } = await supabase.auth.getSession();
    clearTimeout(timeoutId);

    if (error && error.message !== 'Invalid JWT') {
      // Invalid JWT is OK - it means we can reach Supabase
      result.error = `Supabase connection failed: ${error.message}`;
    } else {
      result.supabaseReachable = true;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      result.error = 'Connection timeout - please check your network';
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      result.error = 'Network connection failed - please check your internet connection';
    } else {
      result.error = `Connection error: ${error.message}`;
    }
  }

  return result;
};

export const isNetworkError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('fetch error') ||
    message.includes('connection') ||
    error?.name === 'NetworkError' ||
    error?.name === 'TypeError' && message.includes('fetch')
  );
};

export const getNetworkErrorMessage = (error: any): string => {
  if (!isNetworkError(error)) {
    return error?.message || 'An unexpected error occurred';
  }

  // Check if we're in an iframe (embedded context)
  const isEmbedded = window !== window.top;

  if (isEmbedded) {
    return 'Connection blocked in embedded view. Please open in a new tab to continue.';
  }

  // Generic network error handling
  return 'Unable to connect to the server. Please check your internet connection and try again.';
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry non-network errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const createNetworkAwareRequest = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    // Check connectivity first
    const connectivity = await checkConnectivity(3000);
    
    if (!connectivity.isOnline) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    if (!connectivity.supabaseReachable && connectivity.error) {
      throw new Error(connectivity.error);
    }

    // Execute the original function with retry
    return retryWithBackoff(() => fn(...args));
  };
};