import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertCircle, MessageSquare, Settings, Star, Clock, ArrowRight } from 'lucide-react';
import { useRoleBasedFeatures } from '@/hooks/useRoleBasedFeatures';
import { useAuth } from '@/components/AuthProvider';
import { useFeatureRequest } from '@/hooks/useFeatureRequest';
import { FeatureRequestDialog } from './FeatureRequestDialog';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabledState?: boolean;
  enableFeatureRequest?: boolean;
  showProgressiveDisclosure?: boolean;
  featureDisplayName?: string;
  featureDescription?: string;
  upgradeHint?: string;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showDisabledState = true,
  enableFeatureRequest = false,
  showProgressiveDisclosure = true,
  featureDisplayName,
  featureDescription,
  upgradeHint
}) => {
  const { hasFeature, getDisabledReason, userRole } = useRoleBasedFeatures();
  const { isAdmin } = useAuth();
  const { trackFeatureUsageAttempt } = useFeatureRequest();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  const isFeatureEnabled = hasFeature(feature);
  const disabledReason = getDisabledReason(feature);

  // Track attempted access for analytics
  React.useEffect(() => {
    if (!isFeatureEnabled) {
      trackFeatureUsageAttempt(feature);
    }
  }, [feature, isFeatureEnabled, trackFeatureUsageAttempt]);

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

  // Progressive disclosure - show locked feature preview
  if (showProgressiveDisclosure) {
    return (
      <Card className="relative overflow-hidden border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        {/* Locked overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-3 p-6">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-3 border border-primary/20">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-foreground flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                {featureDisplayName || feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {featureDescription || disabledReason || 'This premium feature is not available for your current role.'}
              </p>
              
              {upgradeHint && (
                <p className="text-xs text-primary/80 flex items-center justify-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {upgradeHint}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {userRole ? userRole.replace('_', ' ').toUpperCase() : 'Unknown Role'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {enableFeatureRequest && !isAdmin && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowRequestDialog(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Access
                </Button>
              )}
              
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    window.location.href = '/admin/security?tab=features';
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Features
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feature preview (blurred/dimmed) */}
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>

        <FeatureRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          feature={feature}
          featureDisplayName={featureDisplayName}
        />
      </Card>
    );
  }

  // Fallback to original simple locked state
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
                onClick={() => setShowRequestDialog(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Access
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <FeatureRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        feature={feature}
        featureDisplayName={featureDisplayName}
      />
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

// Enhanced hook for conditional rendering with UX improvements
export const useFeatureAccess = (feature: string) => {
  const { hasFeature, getDisabledReason, userRole } = useRoleBasedFeatures();
  const { trackFeatureUsageAttempt } = useFeatureRequest();
  
  const trackAndReturn = (hasAccess: boolean, component: React.ReactNode) => {
    if (!hasAccess) {
      trackFeatureUsageAttempt(feature);
    }
    return hasAccess ? component : null;
  };

  return {
    hasAccess: hasFeature(feature),
    reason: getDisabledReason(feature),
    userRole,
    renderIfEnabled: (component: React.ReactNode) => trackAndReturn(hasFeature(feature), component),
    renderIfDisabled: (component: React.ReactNode) => !hasFeature(feature) ? component : null,
    renderWithGuard: (component: React.ReactNode, options?: {
      featureDisplayName?: string;
      featureDescription?: string;
      upgradeHint?: string;
      enableRequest?: boolean;
    }) => (
      <FeatureGuard
        feature={feature}
        enableFeatureRequest={options?.enableRequest ?? true}
        showProgressiveDisclosure={true}
        featureDisplayName={options?.featureDisplayName}
        featureDescription={options?.featureDescription}
        upgradeHint={options?.upgradeHint}
      >
        {component}
      </FeatureGuard>
    ),
  };
};