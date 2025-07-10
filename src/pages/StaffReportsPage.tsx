import React from 'react';
import UnifiedReportsSystem from '@/components/reports/UnifiedReportsSystem';

const StaffReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <UnifiedReportsSystem isAdminView={false} />
    </div>
  );
};

export default StaffReportsPage;