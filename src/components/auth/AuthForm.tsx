
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User, Loader2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordResetModal } from './PasswordResetModal';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { OAuthButtons } from './OAuthButtons';
import { FormField } from './FormField';
import { supabase } from '@/integrations/supabase/client';

interface AuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  showEmailSentMessage: boolean;
  setShowEmailSentMessage: (show: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  isSignUp,
  setIsSignUp,
  showEmailSentMessage,
  setShowEmailSentMessage,
  onSubmit,
}) => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [accountLocked, setAccountLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Real-time validation
  useEffect(() => {
    const errors: {email?: string; password?: string} = {};
    
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation for signup
    if (isSignUp && password) {
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
    }
    
    setFormErrors(errors);
    setIsFormValid(email.length > 0 && password.length > 0 && Object.keys(errors).length === 0);
  }, [email, password, isSignUp]);

  const checkUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_user_exists', { user_email: email });
      return !error && data;
    } catch (error) {
      return false;
    }
  };

  const handleAuthError = async (error: any, email: string) => {
    console.log('Auth error:', error);
    
    // Track failed attempts for account lockout protection
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    if (newFailedAttempts >= 5) {
      setAccountLocked(true);
      setAuthError('Account temporarily locked due to multiple failed attempts. Please try again in 10 minutes or reset your password.');
      return;
    }

    if (error.message?.includes('Invalid login credentials')) {
      // Check if user exists to provide specific guidance
      const userExists = await checkUserExists(email);
      
      if (!userExists) {
        setAuthError(`No account found with email ${email}. Please sign up first or check your email address.`);
      } else {
        setAuthError('Incorrect password. Please check your password or use "Forgot password" to reset it.');
      }
    } else if (error.message?.includes('Email not confirmed')) {
      setAuthError('Please check your email and click the confirmation link before signing in.');
    } else if (error.message?.includes('Too many requests')) {
      setAuthError('Too many login attempts. Please wait a few minutes before trying again.');
    } else if (error.message?.includes('Signup requires a valid password')) {
      setAuthError('Password must be at least 6 characters long.');
    } else if (error.message?.includes('User already registered')) {
      setAuthError('An account with this email already exists. Please sign in instead.');
    } else {
      setAuthError(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountLocked) {
      setAuthError('Account is temporarily locked. Please wait or reset your password.');
      return;
    }

    setAuthError('');
    
    try {
      await onSubmit(e);
      // Reset failed attempts on successful auth
      setFailedAttempts(0);
      setAccountLocked(false);
    } catch (error: any) {
      await handleAuthError(error, email);
    }
  };

  const currentLoading = isLoading || oauthLoading;

  return (
    <>
      <Card className="glass-card animate-scale-in w-full max-w-md mx-auto">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center mb-2 animate-pulse-glow">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl lg:text-3xl text-foreground">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? 'Join SS Plaza to access premium tenant services'
              : 'Sign in to your tenant management dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authError && (
            <Alert variant={accountLocked ? "destructive" : "default"} className="animate-fade-in-up">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {showEmailSentMessage && (
            <div className="glass-subtle border border-success/30 p-4 rounded-lg text-foreground animate-fade-in-up">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-success" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-success">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email to <span className="font-medium text-primary">{email}</span>.
                    Please check your inbox (and spam folder) to verify your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OAuth Sign In */}
          <OAuthButtons 
            isLoading={currentLoading}
            onOAuthStart={() => setOauthLoading(true)}
            onOAuthEnd={() => setOauthLoading(false)}
          />

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <FormField
              id="email"
              label="Work Email"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setAuthError(''); // Clear error when user types
              }}
              placeholder="you@company.com"
              required
              autoComplete="email"
              icon={<Mail size={16} className="text-muted-foreground" />}
              error={formErrors.email}
              success={!!email && !formErrors.email}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Password</span>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-xs text-primary hover:text-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
                    tabIndex={0}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              
              <FormField
                id="password"
                label=""
                type="password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setAuthError(''); // Clear error when user types
                }}
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                icon={<Lock size={16} className="text-muted-foreground" />}
                error={formErrors.password}
                success={!!password && !formErrors.password && !isSignUp}
                showPasswordToggle
              />
              
              {isSignUp && password && (
                <PasswordStrengthIndicator 
                  password={password}
                  className="mt-3"
                />
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2 h-12 text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentLoading || !isFormValid || accountLocked}
            >
              {currentLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : isSignUp ? (
                <>
                  <User size={18} />
                  Create Account
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">or</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowEmailSentMessage(false);
              setFormErrors({});
              setAuthError('');
              setFailedAttempts(0);
              setAccountLocked(false);
            }}
            className="text-center w-full p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={currentLoading}
          >
            <span className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
            </span>
            <span className="text-sm text-primary font-medium">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </button>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              SS Plaza Professional Tenant Platform
            </p>
          </div>
        </CardFooter>
      </Card>

      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </>
  );
};

export default AuthForm;
