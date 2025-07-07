import React, { createContext, useContext, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
import { handleSupabaseError } from '@/utils/errorHandler';

interface ErrorHandlerContextType {
  handleError: (error: unknown, customMessage?: string) => void;
  handleAsyncError: <T>(promise: Promise<T>, customMessage?: string) => Promise<T | null>;
}

const ErrorHandlerContext = createContext<ErrorHandlerContextType | undefined>(undefined);

export const useErrorHandler = () => {
  const context = useContext(ErrorHandlerContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within GlobalErrorHandler');
  }
  return context;
};

interface GlobalErrorHandlerProps {
  children: ReactNode;
}

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({ children }) => {
  const handleError = (error: unknown, customMessage?: string) => {
    const errorMessage = error instanceof Error 
      ? handleSupabaseError(error) 
      : 'An unexpected error occurred';
    
    toast.error(customMessage || errorMessage);
  };

  const handleAsyncError = async <T,>(
    promise: Promise<T>, 
    customMessage?: string
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, customMessage);
      return null;
    }
  };

  const value: ErrorHandlerContextType = {
    handleError,
    handleAsyncError
  };

  return (
    <ErrorHandlerContext.Provider value={value}>
      {children}
    </ErrorHandlerContext.Provider>
  );
};