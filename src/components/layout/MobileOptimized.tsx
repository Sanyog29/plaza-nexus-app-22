import React from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

// Mobile-first container with proper spacing and touch targets
export const MobileContainer: React.FC<MobileOptimizedProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      "px-4 py-2 sm:px-6 lg:px-8",
      "pb-20 sm:pb-4", // Extra bottom padding for mobile nav
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-optimized card with proper touch targets
export const MobileCard: React.FC<MobileOptimizedProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg",
      "p-4 sm:p-6",
      "shadow-sm",
      "touch-manipulation", // Optimizes touch interactions
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-friendly button group
export const MobileButtonGroup: React.FC<MobileOptimizedProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-2 sm:gap-4",
      "w-full",
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-optimized grid
interface MobileGridProps extends MobileOptimizedProps {
  columns?: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  };
}

export const MobileGrid: React.FC<MobileGridProps> = ({ 
  children, 
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  const gridClasses = cn(
    "grid gap-4",
    `grid-cols-${columns.mobile}`,
    columns.tablet && `sm:grid-cols-${columns.tablet}`,
    columns.desktop && `lg:grid-cols-${columns.desktop}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Mobile-safe area component (handles notches, etc.)
export const MobileSafeArea: React.FC<MobileOptimizedProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right",
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-optimized header
export const MobileHeader: React.FC<{ 
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className, title, subtitle, actions }) => {
  return (
    <div className={cn(
      "sticky top-0 z-10 bg-background/95 backdrop-blur-sm",
      "border-b border-border",
      "px-4 py-3 sm:px-6 sm:py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

// Mobile-optimized list item
export const MobileListItem: React.FC<MobileOptimizedProps & {
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, className, onClick, disabled }) => {
  return (
    <div 
      className={cn(
        "flex items-center min-h-[48px]", // Minimum touch target size
        "px-4 py-3",
        "border-b border-border last:border-b-0",
        onClick && !disabled && "cursor-pointer hover:bg-muted/50 active:bg-muted",
        disabled && "opacity-50 cursor-not-allowed",
        "touch-manipulation",
        className
      )}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      {children}
    </div>
  );
};

// Mobile-optimized form wrapper
export const MobileForm: React.FC<MobileOptimizedProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "space-y-4 sm:space-y-6",
      "max-w-full sm:max-w-md lg:max-w-lg",
      className
    )}>
      {children}
    </div>
  );
};

// Mobile bottom sheet / modal overlay
export const MobileModal: React.FC<MobileOptimizedProps & {
  isOpen: boolean;
  onClose: () => void;
}> = ({ children, className, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t border-border",
        "rounded-t-lg",
        "max-h-[90vh] overflow-y-auto",
        "transform transition-transform duration-300",
        isOpen ? "translate-y-0" : "translate-y-full",
        className
      )}>
        {children}
      </div>
    </>
  );
};