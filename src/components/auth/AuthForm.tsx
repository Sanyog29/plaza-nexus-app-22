import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordResetModal } from './PasswordResetModal';

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

  return (
    <>
      <Card className="glass-card animate-scale-in w-full">
        <CardHeader className="space-y-1 text-center lg:text-left">
          <CardTitle className="text-2xl lg:text-3xl text-foreground">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? 'Sign up to access SS Plaza tenant services'
              : 'Sign in to manage your tenant services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailSentMessage && (
            <div className="glass-subtle border border-primary/30 p-4 rounded-lg text-foreground mb-4 animate-fade-in-up">
              <h3 className="font-medium mb-1">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation email to <span className="font-medium text-primary">{email}</span>.
                Please check your inbox (and spam folder) to verify your account.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                <Mail size={16} className="text-muted-foreground" />
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                  <Lock size={16} className="text-muted-foreground" />
                  Password
                </Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-xs text-primary hover:text-primary/90 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2 py-6 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
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
        <CardFooter className="flex flex-col space-y-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowEmailSentMessage(false);
            }}
            className="text-primary hover:text-primary/90 text-sm w-full text-center transition-colors py-2"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
          
          <div className="lg:hidden text-center">
            <p className="text-xs text-muted-foreground">
              SS Plaza Tenant Management Platform
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