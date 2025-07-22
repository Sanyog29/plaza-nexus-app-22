import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import OptimizationEngine from '@/components/admin/OptimizationEngine';

const OptimizationPage = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <OptimizationEngine />;
};

export default OptimizationPage;