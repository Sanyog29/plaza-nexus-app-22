import React from 'react';
import { StaffAssignmentManager } from '@/components/staff/StaffAssignmentManager';

const StaffAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full space-y-6">
        <StaffAssignmentManager />
      </div>
    </div>
  );
};

export default StaffAssignmentPage;