/**
 * Phone number utilities for E.164 normalization and validation
 */

// Common country codes for easy reference
export const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', label: 'United States / Canada' },
  { code: '+91', country: 'IN', label: 'India' },
  { code: '+44', country: 'GB', label: 'United Kingdom' },
  { code: '+86', country: 'CN', label: 'China' },
  { code: '+49', country: 'DE', label: 'Germany' },
  { code: '+33', country: 'FR', label: 'France' },
  { code: '+81', country: 'JP', label: 'Japan' },
  { code: '+82', country: 'KR', label: 'South Korea' },
  { code: '+61', country: 'AU', label: 'Australia' },
  { code: '+971', country: 'AE', label: 'UAE' },
  { code: '+966', country: 'SA', label: 'Saudi Arabia' },
];

/**
 * Validates if a phone number is in E.164 format
 */
export const isValidE164 = (phoneNumber: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

/**
 * Normalizes a phone number to E.164 format
 * Handles common input formats and adds default country code if needed
 */
export const normalizeToE164 = (phoneNumber: string, defaultCountryCode = '+91'): string | null => {
  if (!phoneNumber) return null;
  
  // Remove all spaces, dashes, parentheses, and other non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If already in E.164 format, validate and return
  if (cleaned.startsWith('+')) {
    return isValidE164(cleaned) ? cleaned : null;
  }
  
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
    return isValidE164(cleaned) ? cleaned : null;
  }
  
  // If it's just digits, try to determine the format
  if (/^\d+$/.test(cleaned)) {
    // For Indian numbers starting with 91
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // For US numbers (10 digits)
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    
    // For Indian mobile numbers (10 digits starting with 6-9)
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return '+91' + cleaned;
    }
    
    // For other cases, use default country code
    if (cleaned.length >= 7 && cleaned.length <= 10) {
      return defaultCountryCode + cleaned;
    }
    
    // If longer than 10 digits, assume it includes country code without +
    if (cleaned.length > 10) {
      const withPlus = '+' + cleaned;
      return isValidE164(withPlus) ? withPlus : null;
    }
  }
  
  return null;
};

/**
 * Formats a phone number for display (removes country code for local display)
 */
export const formatForDisplay = (phoneNumber: string, hideCountryCode = false): string => {
  if (!phoneNumber || !isValidE164(phoneNumber)) {
    return phoneNumber;
  }
  
  if (hideCountryCode) {
    // Remove country code and format for local display
    const countryCode = COUNTRY_CODES.find(cc => phoneNumber.startsWith(cc.code));
    if (countryCode) {
      const localNumber = phoneNumber.substring(countryCode.code.length);
      // Format based on length (simple formatting)
      if (localNumber.length === 10) {
        return `${localNumber.slice(0, 5)} ${localNumber.slice(5)}`;
      }
    }
  }
  
  return phoneNumber;
};

/**
 * Validates phone number and returns formatted version or error
 */
export const validateAndFormatPhone = (
  phoneNumber: string, 
  defaultCountryCode = '+91'
): { isValid: boolean; formatted: string | null; error?: string } => {
  if (!phoneNumber.trim()) {
    return { isValid: false, formatted: null, error: 'Phone number is required' };
  }
  
  const normalized = normalizeToE164(phoneNumber, defaultCountryCode);
  
  if (!normalized) {
    return { 
      isValid: false, 
      formatted: null, 
      error: 'Invalid phone number format. Please include country code (e.g., +91 for India)' 
    };
  }
  
  return { isValid: true, formatted: normalized };
};

/**
 * Detects country code from phone number
 */
export const detectCountryCode = (phoneNumber: string): string | null => {
  if (!phoneNumber.startsWith('+')) return null;
  
  const country = COUNTRY_CODES.find(cc => phoneNumber.startsWith(cc.code));
  return country?.code || null;
};