import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  icon,
  error,
  success,
  showPasswordToggle = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  const getFieldStatus = () => {
    if (error) return 'error';
    if (success && value) return 'success';
    return 'default';
  };

  const status = getFieldStatus();

  const getBorderColor = () => {
    if (status === 'error') return 'border-destructive';
    if (status === 'success') return 'border-success';
    if (isFocused) return 'border-primary';
    return 'border-border';
  };

  const getRingColor = () => {
    if (status === 'error') return 'focus:ring-destructive/50';
    if (status === 'success') return 'focus:ring-success/50';
    return 'focus:ring-primary/50';
  };

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className={`flex items-center gap-2 transition-colors ${
          status === 'error' ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            pr-${showPasswordToggle ? '12' : '4'} 
            transition-all duration-200 
            ${getBorderColor()} 
            ${getRingColor()}
            ${status === 'error' ? 'focus:border-destructive' : ''}
            ${status === 'success' ? 'focus:border-success' : ''}
          `}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={status === 'error'}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive animate-fade-in-up">
          {error}
        </p>
      )}
      
      {status === 'success' && value && (
        <p className="text-sm text-success animate-fade-in-up">
          ✓ Looks good
        </p>
      )}
    </div>
  );
};