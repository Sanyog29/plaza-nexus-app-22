import React, { useState, useCallback } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { BreadcrumbFallback } from './breadcrumb-fallback';
import { ErrorBoundary } from 'react-error-boundary';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
interface SmartBreadcrumbProps {
  className?: string;
  showIcons?: boolean;
  showHomeIcon?: boolean;
  maxItems?: number;
}
export const SmartBreadcrumb: React.FC<SmartBreadcrumbProps> = ({
  className,
  showIcons = true,
  showHomeIcon = true,
  maxItems = 3
}) => {
  const {
    breadcrumbs
  } = useBreadcrumbContext();
  const isMobile = useIsMobile();
  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);
  const BreadcrumbContent = () => {
    if (!breadcrumbs.length) {
      return null;
    }

    // On mobile, show only last 2 items
    const displayBreadcrumbs = isMobile && breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs.length > maxItems ? [...breadcrumbs.slice(0, 1), ...breadcrumbs.slice(-(maxItems - 1))] : breadcrumbs;
    const hasEllipsis = breadcrumbs.length > maxItems && !isMobile;
    return <Breadcrumb className={cn('animate-fade-in', className)}>
        
      </Breadcrumb>;
  };
  return <ErrorBoundary FallbackComponent={({
    error,
    resetErrorBoundary
  }) => <BreadcrumbFallback error={error?.message} onRetry={resetErrorBoundary} />} onReset={handleRetry} resetKeys={[retryKey]}>
      <BreadcrumbContent />
    </ErrorBoundary>;
};