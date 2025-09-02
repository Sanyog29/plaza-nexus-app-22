
import React from 'react';
import UnifiedReportsSystem from '@/components/reports/UnifiedReportsSystem';

const AdminReportsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <UnifiedReportsSystem />
      </div>
    </div>
  );
};

export default AdminReportsPage;
