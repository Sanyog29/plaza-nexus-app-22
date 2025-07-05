
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import WelcomeCard from '@/components/auth/WelcomeCard';
import AuthForm from '@/components/auth/AuthForm';

const AuthPage = () => {
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-plaza-dark">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <WelcomeCard />
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
  );
};

export default AuthPage;
