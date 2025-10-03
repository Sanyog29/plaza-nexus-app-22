import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_CODES, normalizeToE164, formatForDisplay } from '@/utils/phoneUtils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Enter mobile number",
  className = "",
  disabled = false
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');

  React.useEffect(() => {
    // Parse existing value to determine country code and local number
    if (value && value.startsWith('+')) {
      const matchingCountry = COUNTRY_CODES.find(cc => value.startsWith(cc.code));
      if (matchingCountry) {
        setSelectedCountryCode(matchingCountry.code);
        setLocalNumber(value.substring(matchingCountry.code.length));
      }
    }
  }, [value]);

  const handleLocalNumberChange = (localValue: string) => {
    // Remove any non-digits
    const cleaned = localValue.replace(/\D/g, '');
    setLocalNumber(cleaned);
    
    // Combine country code with local number and normalize
    if (cleaned) {
      const fullNumber = selectedCountryCode + cleaned;
      const normalized = normalizeToE164(fullNumber);
      onChange(normalized || fullNumber);
    } else {
      onChange('');
    }
  };

  const handleCountryCodeChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    
    // Update the full number with new country code
    if (localNumber) {
      const fullNumber = countryCode + localNumber;
      const normalized = normalizeToE164(fullNumber);
      onChange(normalized || fullNumber);
    }
  };

  // Check if we're in modal mode based on className
  const isModalStyle = className.includes('phone-input-modal');
  
  const selectClassName = isModalStyle
    ? "w-24 rounded-r-none border-r-0 bg-white bg-opacity-5 border-0 text-white focus:ring-2 focus:ring-blue-500"
    : "w-24 rounded-r-none border-r-0";
  
  const inputClassName = isModalStyle
    ? "rounded-l-none bg-white bg-opacity-5 border-0 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
    : "rounded-l-none";

  return (
    <div className={`flex ${className}`}>
      <Select value={selectedCountryCode} onValueChange={handleCountryCodeChange} disabled={disabled}>
        <SelectTrigger className={selectClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={localNumber}
        onChange={(e) => handleLocalNumberChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        disabled={disabled}
      />
    </div>
  );
};