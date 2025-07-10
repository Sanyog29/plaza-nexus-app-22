import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import PendingApprovalPage from './PendingApprovalPage';

interface ApprovalStatusCheckerProps {
  children: React.ReactNode;
}

const ApprovalStatusChecker = ({ children }: ApprovalStatusCheckerProps) => {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || isAdmin) return;

    const checkApprovalStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .single();

      if (profile && profile.approval_status !== 'approved') {
        // User is not approved, they'll see the pending page
        return;
      }
    };

    checkApprovalStatus();
  }, [user, isAdmin]);

  // If user is not admin, check their approval status
  if (user && !isAdmin) {
    // This will be handled by the AuthProvider checkUserRole function
    // which will sign out unapproved users
  }

  return <>{children}</>;
};

export default ApprovalStatusChecker;