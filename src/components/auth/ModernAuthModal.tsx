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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      backgroundImage: 'linear-gradient(to bottom, #0e122d 0%, #1a33a3 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Background overlay */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white bg-opacity-10 backdrop-filter backdrop-blur-3xl rounded-3xl shadow-xl transition-all duration-500 ease-in-out">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-opacity-80 hover:text-opacity-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {/* Tab switcher */}
          <div className="flex bg-white bg-opacity-5 p-1 rounded-full w-fit mx-auto mb-8 relative">
            <button
              onClick={() => setActiveTab('signup')}
              className={`py-2 px-6 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === 'signup'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white text-opacity-80'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setActiveTab('signin')}
              className={`py-2 px-6 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === 'signin'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white text-opacity-80'
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
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-60" size={18} />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 pl-10 bg-white bg-opacity-5 border-0 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
              className="w-full p-3 bg-white bg-opacity-5 border-0 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors border-0"
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
          <div className="text-center text-sm text-white mt-4">OR SIGN IN WITH</div>
          
          {/* Social login buttons */}
          <div className="flex gap-4 mt-2">
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="flex items-center justify-center w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-xl text-white font-semibold transition-colors hover:bg-opacity-10"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png" alt="Google" className="h-5 w-5 mr-2" />
              Google
            </Button>
            <Button
              type="button"
              onClick={handleAppleAuth}
              disabled={isLoading}
              className="flex items-center justify-center w-1/2 p-3 bg-white bg-opacity-5 border-0 rounded-xl text-white font-semibold transition-colors hover:bg-opacity-10"
            >
              <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.44 3.676-2.906 1.156-1.690 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
                <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Apple
            </Button>
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