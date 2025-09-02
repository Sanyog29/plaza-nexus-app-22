
import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthForm from "@/components/auth/AuthForm";
import WelcomeCard from "@/components/auth/WelcomeCard";
import InvitationAcceptance from "@/components/auth/InvitationAcceptance";
import { createNetworkAwareRequest } from "@/utils/networkUtils";
import { SEOHead } from "@/components/seo/SEOHead";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const invitation = searchParams.get('invitation');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUpMode, setIsSignUpMode] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/";

  // If there's an invitation token, show the invitation acceptance form
  if (invitation) {
    return <InvitationAcceptance />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isMobile = /^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ''));
      
      if (isSignUpMode) {
        if (isEmail) {
          const { error } = await supabase.auth.signUp({
            email: identifier,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });
          if (error) throw error;
        } else if (isMobile) {
          const { error } = await supabase.auth.signUp({
            phone: identifier,
            password,
          });
          if (error) {
            if (error.message?.includes('Phone login is not enabled')) {
              throw new Error('Phone number registration is currently disabled. Please use your email address instead.');
            }
            throw error;
          }
        } else {
          throw new Error('Please enter a valid email address or mobile number');
        }
        setEmailSent(true);
        toast({
          title: "Account Created!",
          description: isEmail ? "Please check your email to verify your account." : "Please check your messages to verify your account.",
        });
      } else {
        // For sign in, we need to determine if it's email or phone
        if (isEmail) {
          const { error } = await supabase.auth.signInWithPassword({
            email: identifier,
            password,
          });
          if (error) throw error;
        } else if (isMobile) {
          const { error } = await supabase.auth.signInWithPassword({
            phone: identifier,
            password,
          });
          if (error) {
            if (error.message?.includes('Phone login is not enabled')) {
              throw new Error('Phone number sign-in is currently disabled. Please use your email address instead.');
            }
            throw error;
          }
        } else {
          throw new Error('Please enter a valid email address or mobile number');
        }
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate(from);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email/mobile number or password. Please try again.');
      } else if (error.message?.includes('User already registered')) {
        setError('An account with this email/mobile number already exists. Please sign in instead.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (error.message?.includes('Phone not confirmed')) {
        setError('Please check your messages and confirm your phone number before signing in.');
      } else if (error.message?.includes('No account found')) {
        setError('No account found. Please check your details or sign up.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background mobile-safe">
      <SEOHead
        title="Sign in or Create Account"
        description="Secure login and signup for SS Plaza Building Management System."
        url={`${window.location.origin}/auth`}
        type="website"
      />
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
              identifier={identifier}
              setIdentifier={setIdentifier}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              isSignUp={isSignUpMode}
              setIsSignUp={setIsSignUpMode}
              showEmailSentMessage={emailSent}
              setShowEmailSentMessage={setEmailSent}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
