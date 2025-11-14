import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Lock, Shield, AlertTriangle } from 'lucide-react';

interface PermissionStatusBadgeProps {
  status: 'active' | 'denied' | 'tier' | 'admin' | 'override';
  isDangerous?: boolean;
}

export const PermissionStatusBadge = ({ status, isDangerous }: PermissionStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Active',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
        };
      case 'denied':
        return {
          icon: XCircle,
          label: 'Denied',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
        };
      case 'tier':
        return {
          icon: Lock,
          label: 'Tier Required',
          className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
        };
      case 'admin':
        return {
          icon: Shield,
          label: 'Admin Only',
          className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
        };
      case 'override':
        return {
          icon: AlertTriangle,
          label: 'Override',
          className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${config.className} ${isDangerous ? 'ring-2 ring-red-500' : ''}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
      {isDangerous && <AlertTriangle className="h-3 w-3 ml-1" />}
    </Badge>
  );
};
