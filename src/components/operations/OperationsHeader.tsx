import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Shield, FileText } from 'lucide-react';

interface OperationsHeaderProps {
  isAdmin: boolean;
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({ isAdmin }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Operations Center
        </h1>
        <p className="text-muted-foreground">
          Comprehensive facility management and analytics platform
        </p>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        )}
        <Badge variant="secondary" className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Staff
        </Badge>
      </div>
    </div>
  );
};