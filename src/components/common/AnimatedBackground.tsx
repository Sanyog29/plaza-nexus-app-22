import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'professional' | 'vendor' | 'tenant';
  className?: string;
}

export function AnimatedBackground({ variant = 'default', className = '' }: AnimatedBackgroundProps) {
  const getGradientClasses = () => {
    switch (variant) {
      case 'professional':
        return 'dashboard-gradient-professional';
      case 'vendor':
        return 'dashboard-gradient-vendor';
      case 'tenant':
        return 'dashboard-gradient-tenant';
      default:
        return 'dashboard-gradient-default';
    }
  };

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Animated gradient orbs */}
      <div className={`absolute top-0 -left-4 w-72 h-72 ${getGradientClasses()} rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 dark:opacity-30 animate-float`} />
      <div className={`absolute top-0 -right-4 w-72 h-72 ${getGradientClasses()} rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 dark:opacity-30 animate-float`} style={{ animationDelay: '2s' }} />
      <div className={`absolute -bottom-8 left-20 w-72 h-72 ${getGradientClasses()} rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 dark:opacity-30 animate-float`} style={{ animationDelay: '4s' }} />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />
    </div>
  );
}
