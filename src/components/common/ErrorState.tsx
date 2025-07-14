import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
  variant?: 'card' | 'alert' | 'inline';
  retryLabel?: string;
  showDetails?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  className,
  variant = 'card',
  retryLabel = 'Try again',
  showDetails = false
}) => {
  const errorMessage = error 
    ? typeof error === 'string' 
      ? error 
      : error.message
    : message;

  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {errorMessage}
        </p>
      </div>
      
      {showDetails && error && typeof error === 'object' && (
        <details className="w-full max-w-md">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Show technical details
          </summary>
          <pre className="mt-2 text-xs bg-muted p-3 rounded text-left overflow-auto">
            {error.stack || error.toString()}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorMessage}
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('py-4', className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={cn('border-destructive/20', className)}>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  );
};