import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
  onOverrideChange: (action: PermissionAction, granted: boolean, reason?: string) => void;
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
  onOverrideChange,
  disabled = false
}: PermissionRowProps) => {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const handleOverrideChange = (checked: boolean) => {
    if (checked !== defaultGranted) {
      // Override is being set
      setShowReasonInput(true);
    } else {
      // Override is being removed (revert to default)
      onOverrideChange(action, checked, undefined);
      setShowReasonInput(false);
      setReason('');
    }
  };

  const handleReasonSubmit = () => {
    if (overrideGranted !== null && overrideGranted !== defaultGranted) {
      onOverrideChange(action, overrideGranted, reason);
      setShowReasonInput(false);
    }
  };

  const getStatus = (): 'active' | 'denied' | 'tier' | 'admin' | 'override' => {
    if (overrideGranted !== null) return 'override';
    if (defaultGranted) return 'active';
    if (minimumTier >= 6) return 'admin';
    if (minimumTier >= 3) return 'tier';
    return 'denied';
  };

  const isGranted = overrideGranted !== null ? overrideGranted : defaultGranted;

  return (
    <>
      <TableRow className={isDangerous ? 'bg-red-50/30 dark:bg-red-950/10' : undefined}>
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
          <Checkbox
            checked={overrideGranted !== null ? overrideGranted : defaultGranted}
            onCheckedChange={handleOverrideChange}
            disabled={disabled}
          />
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
      
      {showReasonInput && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30">
            <div className="flex items-center gap-2 py-2">
              <Input
                placeholder="Reason for override (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1"
              />
              <button
                onClick={handleReasonSubmit}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowReasonInput(false);
                  setReason('');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
              >
                Cancel
              </button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
