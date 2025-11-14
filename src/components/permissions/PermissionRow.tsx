import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionStatusBadge } from './PermissionStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { PermissionAction } from '@/hooks/usePropertyPermissions';

interface PermissionRowProps {
  action: PermissionAction;
  name: string;
  description: string;
  minimumTier: number;
  isDangerous: boolean;
  defaultGranted: boolean;
  overrideGranted: boolean | null;
  pendingValue: boolean | null;
  onOverrideChange: (action: PermissionAction, granted: boolean) => void;
  disabled?: boolean;
}

export const PermissionRow = ({
  action,
  name,
  description,
  minimumTier,
  isDangerous,
  defaultGranted,
  overrideGranted,
  pendingValue,
  onOverrideChange,
  disabled = false
}: PermissionRowProps) => {
  const handleOverrideChange = (checked: boolean) => {
    onOverrideChange(action, checked);
  };

  const hasPendingChange = pendingValue !== null;
  const displayValue = hasPendingChange ? pendingValue : (overrideGranted !== null ? overrideGranted : defaultGranted);

  const getStatus = (): 'active' | 'denied' | 'tier' | 'admin' | 'override' => {
    if (overrideGranted !== null) return 'override';
    if (defaultGranted) return 'active';
    if (minimumTier >= 6) return 'admin';
    if (minimumTier >= 3) return 'tier';
    return 'denied';
  };

  const isGranted = overrideGranted !== null ? overrideGranted : defaultGranted;

  return (
    <TableRow className={
      isDangerous 
        ? 'bg-red-50/30 dark:bg-red-950/10' 
        : hasPendingChange 
          ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-l-2 border-yellow-500' 
          : undefined
    }>
      <TableCell className="font-medium">
        <div className="flex items-start gap-2">
          <div>
            <p className="font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {isDangerous && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="text-xs">
                    Dangerous
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This action can have significant security implications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <Checkbox checked={defaultGranted} disabled />
      </TableCell>
      
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            checked={displayValue}
            onCheckedChange={handleOverrideChange}
            disabled={disabled}
          />
          {hasPendingChange && (
            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
              Pending
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <PermissionStatusBadge status={getStatus()} isDangerous={isDangerous} />
          {minimumTier > 1 && (
            <Badge variant="outline" className="text-xs">
              Tier {minimumTier}+
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-right">
        {overrideGranted !== null && overrideGranted !== defaultGranted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This permission has been overridden from the role default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
    </TableRow>
  );
};
