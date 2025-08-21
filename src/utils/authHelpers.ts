
import { supabase } from '@/integrations/supabase/client';
import { isNetworkError, getNetworkErrorMessage } from './networkUtils';

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // Check if a profile exists with this email by checking auth users first
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return false;
    }
    
    // Check if any user has this email
    const userExists = data?.users?.some((user: any) => user.email === email);
    return !!userExists;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getAuthErrorMessage = (error: any): string => {
  // Check for network errors first
  if (isNetworkError(error)) {
    return getNetworkErrorMessage(error);
  }

  const message = error?.message || '';
  
  if (message.includes('Invalid login credentials')) {
    return 'The email or password you entered is incorrect. Please check your credentials and try again.';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (message.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a few minutes before trying again.';
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (message.includes('Signup requires a valid password')) {
    return 'Please enter a valid password (at least 6 characters).';
  }
  
  return message || 'An unexpected error occurred. Please try again.';
};
