import React from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import AccessRestricted from '@/components/admin/AccessRestricted';
import DashboardHeader from '@/components/admin/DashboardHeader';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import RealTimeMetrics from '@/components/admin/RealTimeMetrics';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import StaffWorkloadBalancer from '@/components/admin/StaffWorkloadBalancer';

const AdminDashboardPage = () => {
  const { isAdmin, isLoading } = useAdminDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) return <AccessRestricted />;

  return (
    <div className="px-4 py-6 space-y-6">
      <DashboardHeader />
      <RealTimeMetrics />
      <AdvancedAnalytics />
      <StaffWorkloadBalancer />
    </div>
  );
};

export default AdminDashboardPage;
