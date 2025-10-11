import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus,
  Wrench,
  Users,
  Calendar,
  Building,
  Shield,
  ClipboardList,
  BarChart3,
  Zap,
  Settings,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProcessManagementDialog } from '@/components/maintenance/ProcessManagementDialog';
import { BulkRequestImport } from '@/components/maintenance/BulkRequestImport';

interface QuickActionsProps {
  userRole: 'admin' | 'staff' | 'tenant';
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const navigate = useNavigate();
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);

  const getActions = () => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'New Request', icon: Plus, action: () => navigate('/requests/new'), color: 'bg-blue-500' },
          { label: 'Bulk Import', icon: FileSpreadsheet, action: () => setShowBulkImportDialog(true), color: 'bg-green-500' },
          { label: 'Manage Processes', icon: Settings, action: () => setShowProcessDialog(true), color: 'bg-purple-500' },
          { label: 'View Reports', icon: BarChart3, action: () => navigate('/admin/analytics'), color: 'bg-orange-500' },
        ];
      case 'staff':
        return [
          { label: 'New Request', icon: Plus, action: () => navigate('/requests/new'), color: 'bg-blue-500' },
          { label: 'Take Task', icon: ClipboardList, action: () => navigate('/staff/tasks/new'), color: 'bg-green-500' },
          { label: 'Start Maintenance', icon: Wrench, action: () => navigate('/staff/maintenance/new'), color: 'bg-purple-500' },
          { label: 'View Schedule', icon: Calendar, action: () => navigate('/staff/schedule'), color: 'bg-orange-500' },
        ];
      default:
        return [
          { label: 'New Request', icon: Plus, action: () => navigate('/new-request'), color: 'bg-blue-500' },
          { label: 'Book Room', icon: Building, action: () => navigate('/bookings/new'), color: 'bg-green-500' },
          { label: 'My Requests', icon: ClipboardList, action: () => navigate('/requests'), color: 'bg-purple-500' },
          { label: 'Services', icon: Wrench, action: () => navigate('/services'), color: 'bg-orange-500' },
        ];
    }
  };

  const actions = getActions();

  return (
    <>
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="flex flex-col items-center gap-1 h-auto p-3 hover:shadow-md transition-all duration-200"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProcessManagementDialog 
        open={showProcessDialog} 
        onOpenChange={setShowProcessDialog} 
      />

      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Maintenance Requests</DialogTitle>
          </DialogHeader>
          <BulkRequestImport onComplete={() => setShowBulkImportDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}