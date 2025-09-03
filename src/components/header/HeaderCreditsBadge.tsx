import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/components/AuthProvider';
import { Link } from 'react-router-dom';

export const HeaderCreditsBadge: React.FC = () => {
  const { user, isStaff } = useAuth();
  const { data: credits = 0, isLoading } = useUserCredits();

  if (!user || isLoading) {
    return null;
  }

  const detailsPath = isStaff ? '/maintenance/points' : '/cafeteria';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={detailsPath}>
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <Coins className="h-3 w-3" />
              <span className="text-xs font-medium">{credits.toLocaleString()}</span>
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to view {isStaff ? 'technician points' : 'loyalty points'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};