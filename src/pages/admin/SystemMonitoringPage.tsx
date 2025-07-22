import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import SystemMonitoringDashboard from '@/components/admin/SystemMonitoringDashboard';

const SystemMonitoringPage = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <SystemMonitoringDashboard />;
};

export default SystemMonitoringPage;