import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Package, Store, FileText, TrendingUp, Database, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

export const QuickActions = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {userRole === 'procurement_manager' ? 'Manager Actions' : 'Procurement Actions'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userRole === 'procurement_manager' && (
          <DropdownMenuItem onClick={() => navigate('/procurement/pending-approvals')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Pending Approvals</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => navigate('/procurement/requisitions')}>
          <Package className="mr-2 h-4 w-4" />
          <span>View Requisitions</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/procurement/vendors')}>
          <Store className="mr-2 h-4 w-4" />
          <span>Manage Vendors</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/procurement/orders')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Purchase Orders</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/procurement/budget')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          <span>Budget Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/procurement/item-master')}>
          <Database className="mr-2 h-4 w-4" />
          <span>Item Master</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
