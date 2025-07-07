import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingWrapperProps {
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  error,
  onRetry,
  children,
  skeleton,
  emptyState,
  isEmpty = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {skeleton || (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2 ml-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
};