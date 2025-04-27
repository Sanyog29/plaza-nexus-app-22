
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Building, Lock, Mail, User } from 'lucide-react';

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
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg card-shadow">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-plaza-blue" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create your account' : 'Sign in to SS Plaza'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isSignUp ? 'Sign up to get started' : 'Welcome back to your tenant portal'}
          </p>
        </div>

        {showEmailSentMessage && (
          <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-md text-white">
            <h3 className="font-medium mb-1">Check your email</h3>
            <p className="text-sm text-gray-300">
              We've sent a confirmation email to <span className="font-medium">{email}</span>.
              Please check your inbox (and spam folder) to verify your account before signing in.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 text-white">
              <Mail size={16} className="text-gray-400" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-gray-600 mt-1"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2 text-white">
              <Lock size={16} className="text-gray-400" />
              Password
            </Label>
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

          <div className="text-center border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setShowEmailSentMessage(false);
              }}
              className="text-plaza-blue hover:underline text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
