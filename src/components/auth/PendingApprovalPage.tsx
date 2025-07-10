import { Clock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const PendingApprovalPage = () => {
  const { signOut } = useAuth();

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
                  An administrator will review your account and you'll receive an email notification once approved.
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
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;