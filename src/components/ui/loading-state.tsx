import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingStateProps {
  type?: 'card' | 'list' | 'table' | 'skeleton';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  type = 'skeleton', 
  count = 3,
  className = ""
}) => {
  const renderSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card/50">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg bg-card/30">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-4 gap-4 p-3 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'card':
      return renderCardSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'table':
      return renderTableSkeleton();
    default:
      return renderSkeleton();
  }
};

export const SpinnerLoader: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({ 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary/30 border-t-primary ${sizeClasses[size]} ${className}`} />
  );
};