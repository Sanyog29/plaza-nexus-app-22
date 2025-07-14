import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  User,
  Wrench,
  CheckCircle,
  Clock,
  Users,
  Building
} from 'lucide-react';

interface RecentActivityProps {
  userRole: 'admin' | 'staff' | 'tenant';
}

export function RecentActivity({ userRole }: RecentActivityProps) {
  const getActivities = () => {
    switch (userRole) {
      case 'admin':
        return [
          { 
            icon: Users, 
            action: 'New user registered', 
            details: 'John Doe - Tenant Manager',
            time: '2 min ago',
            type: 'user'
          },
          { 
            icon: CheckCircle, 
            action: 'Maintenance completed', 
            details: 'HVAC repair in Building A',
            time: '15 min ago',
            type: 'completion'
          },
          { 
            icon: Wrench, 
            action: 'New request created', 
            details: 'Plumbing issue reported',
            time: '1 hour ago',
            type: 'request'
          },
          { 
            icon: Building, 
            action: 'Asset added', 
            details: 'Fire extinguisher - Floor 5',
            time: '2 hours ago',
            type: 'asset'
          },
        ];
      case 'staff':
        return [
          { 
            icon: CheckCircle, 
            action: 'Task completed', 
            details: 'Daily safety inspection',
            time: '10 min ago',
            type: 'completion'
          },
          { 
            icon: Wrench, 
            action: 'Started maintenance', 
            details: 'Elevator servicing - Building B',
            time: '1 hour ago',
            type: 'in-progress'
          },
          { 
            icon: Clock, 
            action: 'Shift started', 
            details: 'Morning shift 8:00 AM',
            time: '3 hours ago',
            type: 'shift'
          },
        ];
      default:
        return [
          { 
            icon: CheckCircle, 
            action: 'Request resolved', 
            details: 'AC temperature adjustment',
            time: '30 min ago',
            type: 'completion'
          },
          { 
            icon: Building, 
            action: 'Room booked', 
            details: 'Conference Room B2',
            time: '2 hours ago',
            type: 'booking'
          },
          { 
            icon: Wrench, 
            action: 'Request submitted', 
            details: 'Printer maintenance needed',
            time: '1 day ago',
            type: 'request'
          },
        ];
    }
  };

  const activities = getActivities();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'completion': return 'text-green-500';
      case 'request': return 'text-blue-500';
      case 'user': return 'text-purple-500';
      case 'asset': return 'text-orange-500';
      case 'in-progress': return 'text-yellow-500';
      case 'booking': return 'text-indigo-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'completion': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'request': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Request</Badge>;
      case 'user': return <Badge variant="secondary" className="bg-purple-100 text-purple-800">User</Badge>;
      case 'asset': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Asset</Badge>;
      case 'in-progress': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'booking': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Booking</Badge>;
      default: return <Badge variant="outline">Activity</Badge>;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        <Activity className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
            >
              <activity.icon className={`h-4 w-4 mt-1 ${getTypeColor(activity.type)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{activity.action}</p>
                  {getTypeBadge(activity.type)}
                </div>
                <p className="text-xs text-muted-foreground">{activity.details}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}