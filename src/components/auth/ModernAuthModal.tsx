import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { X, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { validateAndFormatPhone } from "@/utils/phoneUtils";

interface ModernAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModernAuthModal: React.FC<ModernAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'signup') {
        // Sign up logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone
            }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        onClose();
      } else {
        // Sign in logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
        setActiveTab('signin');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay with new gradient */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/lovable-uploads/3774e87a-1d7d-47fc-ab3f-24c7b28b4204.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onClick={onClose}
      />
      
      {/* Glassmorphic Modal */}
      <div 
        className="relative w-full max-w-md rounded-3xl animate-scale-in overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', // Safari support
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 100px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Tab switcher */}
          <div 
            className="flex rounded-full p-1 mb-8" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                activeTab === 'signup'
                  ? 'text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
              style={activeTab === 'signup' ? { 
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)'
              } : {}}
            >
              Sign up
            </button>
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                activeTab === 'signin'
                  ? 'text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
              style={activeTab === 'signin' ? { 
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)'
              } : {}}
            >
              Sign in
            </button>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            {activeTab === 'signup' ? 'Create an account' : 'Welcome back'}
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields - only for signup */}
            {activeTab === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="text-white placeholder:text-white/60 focus:border-white/50 border-white/30 focus:ring-white/30"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-white placeholder:text-white/60 focus:border-white/50 border-white/30 focus:ring-white/30"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={18} />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-white placeholder:text-white/60 focus:border-white/50 border-white/30 pl-10 focus:ring-white/30"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              />
            </div>

            {/* Phone field - only for signup */}
            {activeTab === 'signup' && (
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)', 
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '0.375rem', 
                  border: '1px solid rgba(255, 255, 255, 0.3)' 
                }}
              >
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="(775) 351-6501"
                  className="text-white placeholder:text-white/60 focus:border-white/50 border-transparent bg-transparent"
                />
              </div>
            )}

            {/* Password field */}
            <Input
              type="password"
              placeholder={activeTab === 'signup' ? 'Create password' : 'Enter password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-white placeholder:text-white/60 focus:border-white/50 border-white/30 focus:ring-white/30"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            />

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-medium py-3 rounded-xl transition-all hover:shadow-lg"
            style={{ 
              background: 'rgba(255, 255, 255, 0.25)', 
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}
          >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {activeTab === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                activeTab === 'signup' ? 'Create an account' : 'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
            <span className="px-3 text-sm text-white/70 uppercase">Or sign in with</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              variant="outline"
              className="text-white hover:bg-white/10 py-3 border-white/30 transition-all hover:border-white/50"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </Button>
            <Button
              type="button"
              onClick={handleAppleAuth}
              disabled={isLoading}
              variant="outline"
              className="text-white hover:bg-white/10 py-3 border-white/30 transition-all hover:border-white/50"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.44 3.676-2.906 1.156-1.690 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
                <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-white/60 text-center mt-6">
            By creating an account, you agree to our Terms & Service
          </p>
        </div>
      </div>
    </div>
  );
};