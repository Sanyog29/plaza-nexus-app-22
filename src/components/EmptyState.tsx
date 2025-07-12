import React from 'react';
import { LucideIcon, Package, AlertCircle, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Package,
  title,
  description,
  action,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-sm', spacing: 'space-y-2' },
    md: { icon: 'w-12 h-12', text: 'text-base', spacing: 'space-y-4' },
    lg: { icon: 'w-16 h-16', text: 'text-lg', spacing: 'space-y-6' }
  };

  const classes = sizeClasses[size];

  return (
    <Card className="border-dashed">
      <CardContent className={`flex flex-col items-center justify-center p-8 text-center ${classes.spacing}`}>
        <div className={`rounded-full bg-muted p-4 ${classes.spacing}`}>
          <Icon className={`${classes.icon} text-muted-foreground`} />
        </div>
        <div className="space-y-2">
          <h3 className={`font-medium ${classes.text}`}>{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || 'default'}
            size={size === 'sm' ? 'sm' : 'default'}
          >
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Predefined empty states for common scenarios
export const NoDataFound = ({ onRefresh }: { onRefresh?: () => void }) => (
  <EmptyState
    icon={Search}
    title="No data found"
    description="We couldn't find any data to display. Try refreshing or check back later."
    action={onRefresh ? { label: 'Refresh', onClick: onRefresh, variant: 'outline' } : undefined}
  />
);

export const NoItemsFound = ({ itemName, onCreate }: { itemName: string; onCreate?: () => void }) => (
  <EmptyState
    icon={Package}
    title={`No ${itemName.toLowerCase()} found`}
    description={`You haven't created any ${itemName.toLowerCase()} yet. Get started by creating your first one.`}
    action={onCreate ? { label: `Create ${itemName}`, onClick: onCreate } : undefined}
  />
);

export const ErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description="We encountered an error while loading the data. Please try again."
    action={onRetry ? { label: 'Try Again', onClick: onRetry, variant: 'outline' } : undefined}
  />
);