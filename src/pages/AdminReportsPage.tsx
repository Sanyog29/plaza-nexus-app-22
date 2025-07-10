import React from 'react';
import UnifiedReportsSystem from '@/components/reports/UnifiedReportsSystem';
import { DataExportTools } from '@/components/export/DataExportTools';

const AdminReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <UnifiedReportsSystem isAdminView={true} />
      <DataExportTools />
    </div>
  );
};

export default AdminReportsPage;