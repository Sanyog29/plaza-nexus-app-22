
import React from 'react';
import UnifiedReportsSystem from '@/components/reports/UnifiedReportsSystem';

const AdminReportsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-6">
        <UnifiedReportsSystem />
      </div>
    </div>
  );
};

export default AdminReportsPage;
