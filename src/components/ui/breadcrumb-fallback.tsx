import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BreadcrumbFallbackProps {
  error?: string;
  onRetry?: () => void;
}

export const BreadcrumbFallback: React.FC<BreadcrumbFallbackProps> = ({ error, onRetry }) => {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-md">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="text-sm text-destructive">Breadcrumb Error</span>
      
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
        >
          Retry
        </Button>
      )}
      
      <Link 
        to="/" 
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground ml-2"
      >
        <Home className="h-3 w-3" />
        Home
      </Link>
    </div>
  );
};