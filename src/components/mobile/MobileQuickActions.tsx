import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface MobileQuickActionsProps {
  actions?: {
    primary?: Array<{
      label: string;
      icon: React.ComponentType<any>;
      onClick: () => void;
      variant?: "default" | "outline" | "secondary";
      badge?: number;
    }>;
    secondary?: Array<{
      label: string;
      icon: React.ComponentType<any>;
      onClick: () => void;
    }>;
  };
}

export function MobileQuickActions({ actions }: MobileQuickActionsProps) {
  const { isAdmin, isStaff } = useAuth();

  // Default actions based on user role
  const defaultActions = {
    primary: [
      {
        label: "New Request",
        icon: Plus,
        onClick: () => window.location.href = '/requests/new',
        variant: "default" as const
      },
      {
        label: "Search",
        icon: Search,
        onClick: () => {},
        variant: "outline" as const
      },
      {
        label: "Notifications",
        icon: Bell,
        onClick: () => window.location.href = '/alerts',
        variant: "outline" as const,
        badge: 3
      }
    ],
    secondary: [
      {
        label: "Filter",
        icon: Filter,
        onClick: () => {}
      },
      {
        label: "Refresh",
        icon: RefreshCw,
        onClick: () => window.location.reload()
      },
      {
        label: "Calendar",
        icon: Calendar,
        onClick: () => window.location.href = '/bookings'
      },
      ...(isAdmin || isStaff ? [
        {
          label: "Export",
          icon: Download,
          onClick: () => {}
        },
        {
          label: "Import",
          icon: Upload,
          onClick: () => {}
        },
        {
          label: "Settings",
          icon: Settings,
          onClick: () => window.location.href = '/admin/settings'
        }
      ] : [])
    ]
  };

  const finalActions = actions || defaultActions;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        {finalActions.primary && finalActions.primary.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {finalActions.primary.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  className="w-full justify-start h-11 relative"
                  onClick={action.onClick}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {action.label}
                  {action.badge && action.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {action.badge > 9 ? '9+' : action.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {/* Secondary Actions */}
        {finalActions.secondary && finalActions.secondary.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {finalActions.secondary.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-16 p-2"
                  onClick={action.onClick}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs text-center leading-tight">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}