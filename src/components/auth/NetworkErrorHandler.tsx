import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface NetworkErrorHandlerProps {
  error: string;
  onRetry?: () => void;
  showOpenInNewTab?: boolean;
}

export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({ 
  error, 
  onRetry,
  showOpenInNewTab = false 
}) => {
  const isEmbeddedContext = window !== window.top;
  const shouldShowNewTab = showOpenInNewTab || isEmbeddedContext;

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <Alert variant="destructive" className="animate-fade-in-up">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <p>{error}</p>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          
          {shouldShowNewTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          )}
        </div>
        
        {isEmbeddedContext && (
          <p className="text-xs text-muted-foreground">
            Some network restrictions may prevent authentication in embedded views.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};