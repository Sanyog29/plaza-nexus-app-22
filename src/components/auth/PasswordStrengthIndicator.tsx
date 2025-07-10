import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const requirements = [
    { text: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { text: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { text: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { text: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
    { text: 'Contains special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  const passedCount = requirements.filter(req => req.test(password)).length;
  const strength = passedCount === 0 ? 0 : Math.min((passedCount / requirements.length) * 100, 100);

  const getStrengthColor = () => {
    if (strength < 40) return 'hsl(var(--destructive))';
    if (strength < 80) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Password strength</span>
          <span className="text-sm font-medium" style={{ color: getStrengthColor() }}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{ 
              width: `${strength}%`,
              backgroundColor: getStrengthColor()
            }}
          />
        </div>
      </div>
      
      <div className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              {passed ? (
                <Check size={14} className="text-success flex-shrink-0" />
              ) : (
                <X size={14} className="text-muted-foreground flex-shrink-0" />
              )}
              <span className={passed ? 'text-success' : 'text-muted-foreground'}>
                {req.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};