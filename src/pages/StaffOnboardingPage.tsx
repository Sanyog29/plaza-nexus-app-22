import React from 'react';
import { L1OnboardingForm } from '@/components/staff/L1OnboardingForm';

const StaffOnboardingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Staff Onboarding</h1>
          <p className="text-muted-foreground mt-2">
            Complete the onboarding process for new L1 staff members
          </p>
        </div>
        
        <L1OnboardingForm />
      </div>
    </div>
  );
};

export default StaffOnboardingPage;