import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Mail, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PendingApprovalPage = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  // Real-time subscription for instant approval detection
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`approval-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile approval status changed:', payload);
          if (payload.new.approval_status === 'approved') {
            toast({
              title: 'Account Approved!',
              description: 'Your account has been approved. Redirecting...',
            });
            setTimeout(() => navigate('/dashboard'), 1000);
          } else if (payload.new.approval_status === 'rejected') {
            toast({
              title: 'Account Rejected',
              description: 'Your account application was not approved.',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, toast]);

  const handleCheckStatus = async () => {
    if (!user) return;
    
    setIsChecking(true);
    const { data: profile } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', user.id)
      .single();

    setIsChecking(false);

    if (profile?.approval_status === 'approved') {
      toast({
        title: 'Account Approved!',
        description: 'Your account has been approved. Redirecting...',
      });
      setTimeout(() => navigate('/dashboard'), 1000);
    } else if (profile?.approval_status === 'rejected') {
      toast({
        title: 'Account Rejected',
        description: 'Your account application was not approved.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Still Pending',
        description: 'Your account is still awaiting approval.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully but requires administrator approval before you can access the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">What happens next?</p>
                <p className="text-sm text-muted-foreground">
                  An administrator will review your account and you'll be notified once approved. This page will automatically update.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Need immediate access?</p>
                <p className="text-sm text-muted-foreground">
                  Contact your building administrator or facilities manager for urgent approval.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Check Status
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;
