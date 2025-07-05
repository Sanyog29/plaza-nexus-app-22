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
      <Card className="bg-card/50 backdrop-blur border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isSignUp 
              ? 'Sign up to access SS Plaza tenant services'
              : 'Sign in to manage your tenant services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailSentMessage && (
            <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-md text-white mb-4">
              <h3 className="font-medium mb-1">Check your email</h3>
              <p className="text-sm text-gray-300">
                We've sent a confirmation email to <span className="font-medium">{email}</span>.
                Please check your inbox (and spam folder) to verify your account.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 text-white">
                <Mail size={16} className="text-gray-400" />
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-gray-600 mt-1"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-2 text-white">
                  <Lock size={16} className="text-gray-400" />
                  Password
                </Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-xs text-plaza-blue hover:underline"
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
                className="bg-card border-gray-600 mt-1"
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-plaza-blue hover:bg-blue-700 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">◌</span>
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
        <CardFooter>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowEmailSentMessage(false);
            }}
            className="text-plaza-blue hover:underline text-sm w-full text-center"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
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