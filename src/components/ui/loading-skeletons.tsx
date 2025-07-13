import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => (
  <div className={cn("space-y-4", className)}>
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

export const CardSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TableSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => (
  <div className={cn("space-y-3", className)}>
    <div className="flex space-x-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, j) => (
          <Skeleton key={j} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => (
  <div className={cn("space-y-6", className)}>
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Main Content */}
    <div className="grid gap-6 md:grid-cols-2">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);