import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  spacing = 'md'
}) => {
  const isMobile = useIsMobile();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-[1600px]',
    full: 'w-full'
  };

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'px-4 py-2' : 'px-6 py-3',
    md: isMobile ? 'px-4 py-4' : 'px-6 py-6', 
    lg: isMobile ? 'px-6 py-6' : 'px-8 py-8'
  };

  const spacingClasses = {
    none: '',
    sm: 'spacing-sm',
    md: 'spacing-md lg:spacing-lg',
    lg: 'spacing-lg lg:spacing-xl'
  };

  return (
    <div className={cn(
      maxWidth === 'full' ? 'w-full' : 'container mx-auto',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};