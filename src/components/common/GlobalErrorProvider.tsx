import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
}

interface GlobalErrorContextType {
  reportError: (error: Error | string, context?: string) => void;
  handleAsyncError: <T>(promise: Promise<T>, context?: string) => Promise<T | null>;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const useGlobalError = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within GlobalErrorProvider');
  }
  return context;
};

interface GlobalErrorProviderProps {
  children: ReactNode;
}

export const GlobalErrorProvider: React.FC<GlobalErrorProviderProps> = ({ children }) => {
  const reportError = useCallback(async (error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    const errorDetails: ErrorDetails = {
      message: errorMessage,
      stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Try to get current user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        errorDetails.userId = user.id;
      }
    } catch (authError) {
      // Ignore auth errors in error reporting
    }

    // Log to console
    console.error('Global Error:', {
      context,
      ...errorDetails,
    });

    // Store in localStorage as fallback (for debugging)
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push({ context, ...errorDetails });
      
      // Keep only last 50 errors
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50);
      }
      
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.error('Failed to store error in localStorage:', storageError);
    }

    // Show user-friendly toast
    toast({
      title: "Error",
      description: context ? `${context}: ${errorMessage}` : errorMessage,
      variant: "destructive",
    });
  }, []);

  const handleAsyncError = useCallback(async <T,>(
    promise: Promise<T>, 
    context?: string
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), context);
      return null;
    }
  }, [reportError]);

  const value: GlobalErrorContextType = {
    reportError,
    handleAsyncError,
  };

  return (
    <GlobalErrorContext.Provider value={value}>
      {children}
    </GlobalErrorContext.Provider>
  );
};
