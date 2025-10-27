
import React from 'react';
import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string): JSX.Element => {
  switch (status) {
    case 'active':
      return <Badge variant="status-completed">Active</Badge>;
    case 'break':
      return <Badge variant="outline">On Break</Badge>;
    case 'offline':
      return <Badge variant="secondary">Offline</Badge>;
    case 'operational':
      return <Badge variant="status-completed">Operational</Badge>;
    case 'needs-attention':
      return <Badge variant="priority-medium">Needs Attention</Badge>;
    case 'maintenance-due':
      return <Badge variant="status-overdue">Maintenance Due</Badge>;
    case 'present':
      return <Badge variant="status-completed">Present</Badge>;
    case 'absent':
      return <Badge variant="secondary">Absent</Badge>;
    case 'open':
    case 'pending':
      return <Badge variant="status-pending">Pending</Badge>;
    case 'assigned':
      return <Badge variant="status-pending">Assigned</Badge>;
    case 'in-progress':
    case 'in_progress':
      return <Badge variant="status-in-progress">In Progress</Badge>;
    case 'completed':
      return <Badge variant="status-completed">Completed</Badge>;
    case 'overdue':
      return <Badge variant="status-overdue">Overdue</Badge>;
    case 'en_route':
      return <Badge variant="status-in-progress">En Route</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelled</Badge>;
    case 'closed':
      return <Badge variant="status-completed">Closed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const getPriorityBadge = (priority: string): JSX.Element => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
      return <Badge variant="priority-high">High</Badge>;
    case 'medium':
    case 'normal':
      return <Badge variant="priority-medium">Medium</Badge>;
    case 'low':
      return <Badge variant="priority-low">Low</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const getTrendBadge = (trend: string): JSX.Element => {
  switch (trend) {
    case 'improving':
      return <Badge variant="status-completed">Improving</Badge>;
    case 'stable':
      return <Badge variant="outline">Stable</Badge>;
    case 'declining':
      return <Badge variant="status-overdue">Declining</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
