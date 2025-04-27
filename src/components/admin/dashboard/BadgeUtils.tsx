
import React from 'react';
import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string): JSX.Element => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'break':
      return <Badge variant="outline">On Break</Badge>;
    case 'offline':
      return <Badge variant="secondary">Offline</Badge>;
    case 'operational':
      return <Badge className="bg-green-600">Operational</Badge>;
    case 'needs-attention':
      return <Badge className="bg-yellow-600">Needs Attention</Badge>;
    case 'maintenance-due':
      return <Badge variant="destructive">Maintenance Due</Badge>;
    case 'present':
      return <Badge className="bg-green-600">Present</Badge>;
    case 'absent':
      return <Badge variant="secondary">Absent</Badge>;
    case 'open':
      return <Badge className="bg-blue-600">Open</Badge>;
    case 'assigned':
      return <Badge className="bg-yellow-600">Assigned</Badge>;
    case 'in-progress':
      return <Badge className="bg-purple-600">In Progress</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const getPriorityBadge = (priority: string): JSX.Element => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-600">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const getTrendBadge = (trend: string): JSX.Element => {
  switch (trend) {
    case 'improving':
      return <Badge className="bg-green-600">Improving</Badge>;
    case 'stable':
      return <Badge variant="outline">Stable</Badge>;
    case 'declining':
      return <Badge variant="destructive">Declining</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
