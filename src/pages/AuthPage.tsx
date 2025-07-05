
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Building, Lock, Mail, User, Phone, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

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
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-plaza-blue to-blue-700 text-white p-6 hidden md:block">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">SS Plaza</h1>
                <p className="text-sm opacity-90">Powered by Autopilot Offices</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Info size={18} />
                Building Features
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                <li>24/7 Access Control & Security</li>
                <li>Smart Building Management</li>
                <li>Modern Meeting Facilities</li>
                <li>Premium Cafeteria Services</li>
              </ul>
            </div>
            <Separator className="bg-white/20" />
            <div>
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <div className="text-sm opacity-90 space-y-1">
                <p className="flex items-center gap-2">
                  <Phone size={14} />
                  Support: +91 80 4123 5000
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} />
                  Email: support@ssplaza.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth Form */}
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};

export default AuthPage;
