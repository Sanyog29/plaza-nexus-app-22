
import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import WelcomeCard from '@/components/auth/WelcomeCard';
import AuthForm from '@/components/auth/AuthForm';
import InvitationAcceptance from '@/components/auth/InvitationAcceptance';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const invitation = searchParams.get('invitation');
  
  // If there's an invitation token, show the invitation acceptance form
  if (invitation) {
    return <InvitationAcceptance />;
  }

  // Otherwise, show the regular auth form
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showEmailSentMessage, setShowEmailSentMessage] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: uiToast } = useToast();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailSentMessage(false);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
        
        // Show a more detailed message about email confirmation
        setShowEmailSentMessage(true);
        toast("Account created", {
          description: "Please check your email (including spam folder) to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        navigate(from);
      }
    } catch (error: any) {
      uiToast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background mobile-safe">
      {/* Header with branding to match main app */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SP</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">SS Plaza</h1>
              <p className="text-xs text-muted-foreground">Building Management System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center animate-fade-in-up">
          <div className="hidden lg:block">
            <WelcomeCard />
          </div>
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <AuthForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              showEmailSentMessage={showEmailSentMessage}
              setShowEmailSentMessage={setShowEmailSentMessage}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
