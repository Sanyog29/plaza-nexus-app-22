import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { PageLoader } from "@/components/LoadingSpinner";
import { SEOHead } from "@/components/seo/SEOHead";

const ResetPassword = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateResetSession = async () => {
      try {
        // First check if we already have a valid session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('Valid session found');
          setHasValidSession(true);
          setIsValidating(false);
          return;
        }

        // Extract tokens from URL hash (format: #access_token=xxx&refresh_token=yyy)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('type');

        if (!accessToken || !refreshToken || tokenType !== 'recovery') {
          throw new Error('Invalid or missing reset tokens');
        }

        console.log('Setting session with extracted tokens');
        
        // Establish session with the tokens from email link
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        if (session) {
          console.log('Session established successfully');
          setHasValidSession(true);
          
          // Clean up URL hash after successful session establishment
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          throw new Error('Failed to establish session');
        }
      } catch (error: any) {
        console.error('Reset session validation error:', error);
        toast({
          variant: "destructive",
          title: "Invalid or expired reset link",
          description: "Please request a new password reset link.",
        });
        navigate('/auth');
      } finally {
        setIsValidating(false);
      }
    };

    validateResetSession();
  }, [navigate, toast]);

  if (isValidating) {
    return <PageLoader />;
  }

  if (!hasValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background mobile-safe">
      <SEOHead
        title="Reset Password"
        description="Create a new password for your AUTOPILOT account."
        url={`${window.location.origin}/reset-password`}
        type="website"
      />
      
      {/* Header with branding */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SP</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AUTOPILOT</h1>
              <p className="text-xs text-muted-foreground">Building Management System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <UpdatePasswordForm />
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
