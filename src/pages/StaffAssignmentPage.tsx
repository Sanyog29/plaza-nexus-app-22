import React from 'react';
import { StaffAssignmentManager } from '@/components/staff/StaffAssignmentManager';

const StaffAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <StaffAssignmentManager />
      </div>
    </div>
  );
};

export default StaffAssignmentPage;