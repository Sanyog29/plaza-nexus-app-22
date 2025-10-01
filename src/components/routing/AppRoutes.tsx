import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardSkeleton } from '@/components/ui/loading-skeletons';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy load components for better performance
const UnifiedAdminDashboard = React.lazy(() => import('@/pages/UnifiedAdminDashboard'));

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton className="p-6" />}>
        <Routes>
          <Route path="/admin/*" element={<UnifiedAdminDashboard />} />
          <Route path="/dashboard" element={<UnifiedAdminDashboard />} />
          <Route path="*" element={<UnifiedAdminDashboard />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};