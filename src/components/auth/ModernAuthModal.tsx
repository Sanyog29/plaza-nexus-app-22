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
  const [phoneError, setPhoneError] = useState('');
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
    setPhoneError('');

    try {
      if (activeTab === 'signup') {
        // Validate phone number if provided
        let validatedPhone = phone;
        if (phone) {
          const phoneValidation = validateAndFormatPhone(phone);
          if (!phoneValidation.isValid) {
            setPhoneError(phoneValidation.error || 'Invalid phone number');
            setIsLoading(false);
            return;
          }
          validatedPhone = phoneValidation.formatted || phone;
        }

        // Sign up logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: validatedPhone
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
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // Enhanced error handling with more specific cases
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
        setActiveTab('signin');
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('signup_disabled')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (error.message?.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (error.message?.includes('Unable to validate email address')) {
        setError('Please enter a valid email address.');
      } else if (error.message?.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('fetch')) {
        setError('Connection error. Please check your internet and try again.');
      } else {
        console.warn('Unhandled auth error:', error.message);
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal background with animated gradient */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
      
      {/* Modal container */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 gradient-blue-purple opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse-gentle" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-opacity-80 hover:text-opacity-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <div className="relative z-10 p-8">
          {/* Tab switcher */}
          <div className="relative flex bg-white/5 rounded-full p-1 mb-8">
            <div 
              className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-transform duration-300 shadow-lg ${
                activeTab === 'signin' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              onClick={() => setActiveTab('signup')}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors rounded-full z-10 ${
                activeTab === 'signup'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setActiveTab('signin')}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors rounded-full z-10 ${
                activeTab === 'signin'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign in
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            {activeTab === 'signup' ? 'Create an account' : 'Sign in to your account'}
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name fields - only for signup */}
            {activeTab === 'signup' && (
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-full !text-white placeholder:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                  style={{ color: '#ffffff' }}
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-full !text-white placeholder:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                  style={{ color: '#ffffff' }}
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={18} />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 pl-10 bg-white bg-opacity-5 border-0 rounded-full !text-white placeholder:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                style={{ color: '#ffffff' }}
              />
            </div>

            {/* Phone field - only for signup */}
            {activeTab === 'signup' && (
              <div>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter mobile number"
                  className="phone-input-modal"
                />
                {phoneError && (
                  <p className="text-white text-xs mt-1">{phoneError}</p>
                )}
              </div>
            )}

            {/* Password field */}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-white bg-opacity-5 border-0 rounded-full !text-white placeholder:!text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
              style={{ color: '#ffffff' }}
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-4 gradient-blue-purple text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 hover:shadow-2xl animate-shimmer"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {activeTab === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="text-center text-sm text-white/60 mt-6 mb-4">OR CONTINUE WITH</div>
          
          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-3 bg-white bg-opacity-5 hover:bg-opacity-15 text-white rounded-full transition-all disabled:opacity-50 hover:scale-105 border border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={handleAppleAuth}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-3 bg-white bg-opacity-5 hover:bg-opacity-15 text-white rounded-full transition-all disabled:opacity-50 hover:scale-105 border border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-white text-opacity-80 mt-4">
            By creating an account, you agree to our <a href="#" className="underline text-white">Terms & Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};