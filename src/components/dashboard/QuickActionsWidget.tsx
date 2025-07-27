import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  AlertTriangle,
  Users,
  Calendar,
  Wrench,
  Shield,
  Coffee,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  Building
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  count?: number;
  urgent?: boolean;
  roles: string[];
}

export const QuickActionsWidget = () => {
  const { userRole, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      title: 'New Maintenance Request',
      description: 'Report equipment issues',
      icon: <Wrench className="h-5 w-5" />,
      path: '/requests/new?type=maintenance',
      urgent: true,
      roles: ['admin', 'facility_staff', 'tenant']
    },
    {
      title: 'Security Check',
      description: 'Start patrol or incident report',
      icon: <Shield className="h-5 w-5" />,
      path: '/security',
      roles: ['admin', 'security_guard', 'facility_staff']
    },
    {
      title: 'Staff Assignment',
      description: 'Assign tasks to team members',
      icon: <Users className="h-5 w-5" />,
      path: '/admin/users',
      count: 3,
      roles: ['admin', 'ops_supervisor']
    },
    {
      title: 'Room Booking',
      description: 'Reserve meeting spaces',
      icon: <Calendar className="h-5 w-5" />,
      path: '/bookings',
      roles: ['admin', 'facility_staff', 'tenant']
    },
    {
      title: 'Vendor Order',
      description: 'Place new supply order',
      icon: <Coffee className="h-5 w-5" />,
      path: '/cafeteria',
      roles: ['admin', 'vendor', 'tenant']
    },
    {
      title: 'Inspection Checklist',
      description: 'Start safety inspection',
      icon: <ClipboardList className="h-5 w-5" />,
      path: '/security?tab=patrol',
      roles: ['admin', 'facility_staff', 'security_guard']
    },
    {
      title: 'Emergency Alert',
      description: 'Send building-wide notification',
      icon: <AlertTriangle className="h-5 w-5" />,
      path: '/alerts',
      urgent: true,
      roles: ['admin', 'security_guard']
    },
    {
      title: 'Performance Report',
      description: 'Generate analytics report',
      icon: <TrendingUp className="h-5 w-5" />,
      path: '/admin/analytics',
      roles: ['admin', 'ops_supervisor']
    }
  ];

  // Filter actions based on user role
  const availableActions = quickActions.filter(action => {
    if (isAdmin) return true;
    if (isStaff && action.roles.includes('facility_staff')) return true;
    return action.roles.includes(userRole || '');
  });

  const recentTasks = [
    { 
      title: 'HVAC Maintenance Floor 5',
      status: 'in_progress',
      assignee: 'Mike Johnson',
      time: '2 hours ago'
    },
    {
      title: 'Visitor Access Setup',
      status: 'completed',
      assignee: 'Sarah Wilson',
      time: '4 hours ago'
    },
    {
      title: 'Conference Room Cleaning',
      status: 'pending',
      assignee: 'David Chen',
      time: '6 hours ago'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Fast access to common facility management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableActions.slice(0, 6).map((action, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.urgent ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {action.count && (
                  <Badge variant="secondary" className="text-xs">
                    {action.count}
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant={action.urgent ? "destructive" : "outline"}
                  onClick={() => navigate(action.path)}
                >
                  {action.urgent ? 'Urgent' : 'Start'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest tasks and updates from your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Building className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <p className="text-xs text-muted-foreground">{task.assignee} • {task.time}</p>
                </div>
              </div>
              {getStatusBadge(task.status)}
            </div>
          ))}
          
          <div className="pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" className="w-full">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};