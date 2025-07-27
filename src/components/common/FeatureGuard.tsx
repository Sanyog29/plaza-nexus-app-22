import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertCircle, MessageSquare, Settings } from 'lucide-react';
import { useRoleBasedFeatures } from '@/hooks/useRoleBasedFeatures';
import { useAuth } from '@/components/AuthProvider';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabledState?: boolean;
  enableFeatureRequest?: boolean;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showDisabledState = true,
  enableFeatureRequest = false
}) => {
  const { hasFeature, getDisabledReason, userRole } = useRoleBasedFeatures();
  const { isAdmin } = useAuth();
  
  const isFeatureEnabled = hasFeature(feature);
  const disabledReason = getDisabledReason(feature);

  // If feature is enabled, render children
  if (isFeatureEnabled) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If showDisabledState is false, render nothing
  if (!showDisabledState) {
    return null;
  }

  // Default disabled state UI
  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <CardContent className="flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Feature Not Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {disabledReason || 'This feature is not available for your current access level.'}
            </p>
            
            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {userRole ? userRole.replace('_', ' ').toUpperCase() : 'Unknown Role'}
              </Badge>
            </div>
          </div>

          {enableFeatureRequest && !isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Here you could implement feature request functionality
                  // For now, just show a toast
                  console.log(`Feature request: ${feature} for role: ${userRole}`);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Access
              </Button>
              
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Navigate to admin settings
                    window.location.href = '/admin/security?tab=features';
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Features
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Higher-order component for easy feature wrapping
export const withFeatureGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  options?: Omit<FeatureGuardProps, 'feature' | 'children'>
) => {
  return function WithFeatureGuardComponent(props: P) {
    return (
      <FeatureGuard feature={feature} {...options}>
        <WrappedComponent {...props} />
      </FeatureGuard>
    );
  };
};

// Hook for conditional rendering in components
export const useFeatureAccess = (feature: string) => {
  const { hasFeature, getDisabledReason } = useRoleBasedFeatures();
  
  return {
    hasAccess: hasFeature(feature),
    reason: getDisabledReason(feature),
    renderIfEnabled: (component: React.ReactNode) => hasFeature(feature) ? component : null,
    renderIfDisabled: (component: React.ReactNode) => !hasFeature(feature) ? component : null,
  };
};