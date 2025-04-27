
import React from 'react';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Sample request data with enhanced information and SLA timers
const requestData = [
  {
    id: 'req-001',
    title: 'AC not working in Meeting Room B',
    category: 'Maintenance',
    priority: 'high',
    status: 'In Progress',
    createdAt: '2025-04-25T10:30:00',
    updatedAt: '2025-04-25T14:15:00',
    assignedTo: 'Technical Team',
    eta: '2025-04-25T16:30:00',
    slaMinutesLeft: 102, // 1h 42m left
    slaPercentage: 35, // 35% of SLA time remaining
    isBreaching: false,
  },
  {
    id: 'req-002',
    title: 'Request for deep cleaning',
    category: 'Housekeeping',
    priority: 'medium',
    status: 'Completed',
    createdAt: '2025-04-23T08:45:00',
    updatedAt: '2025-04-24T11:20:00',
    assignedTo: 'Housekeeping Team',
    rating: 5,
  },
  {
    id: 'req-003',
    title: 'WiFi connection issues',
    category: 'IT',
    priority: 'high',
    status: 'New',
    createdAt: '2025-04-27T09:10:00',
    updatedAt: '2025-04-27T09:10:00',
    assignedTo: 'IT Support',
    slaMinutesLeft: 43, // 0h 43m left
    slaPercentage: 15, // 15% of SLA time remaining
    isBreaching: true,
    escalatedTo: 'Network Manager',
  },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'new':
      return 'bg-plaza-blue bg-opacity-20 text-plaza-blue';
    case 'in progress':
      return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    case 'completed':
      return 'bg-green-500 bg-opacity-20 text-green-500';
    default:
      return 'bg-gray-500 bg-opacity-20 text-gray-500';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    case 'medium':
      return <Badge variant="default" className="bg-yellow-600 text-xs">Medium Priority</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">Low Priority</Badge>;
  }
};

const formatSlaTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m left`;
};

const RequestsPage = () => {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Requests</h2>
          <p className="text-sm text-gray-400 mt-1">Track your service requests</p>
        </div>
        <Link to="/requests/new">
          <Button className="bg-plaza-blue hover:bg-blue-700">New Request</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-plaza-blue/20 p-2 rounded-full">
              <Clock size={20} className="text-plaza-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-lg font-semibold text-white">4</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-lg font-semibold text-white">2</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <CheckCircle size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-lg font-semibold text-white">8</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        {requestData.map((request) => (
          <Link key={request.id} to={`/requests/${request.id}`}>
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full mr-3 mt-1">
                      <MessageSquare size={18} className="text-plaza-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{request.title}</h4>
                        {getPriorityBadge(request.priority)}
                        {request.escalatedTo && (
                          <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border-red-800">
                            Escalated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{request.category}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          Assigned to: {request.assignedTo}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated: {new Date(request.updatedAt).toLocaleString()}
                        </p>
                        
                        {/* SLA Timer */}
                        {request.slaMinutesLeft !== undefined && request.status !== 'Completed' && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <Timer size={12} className={request.isBreaching ? "text-red-400" : "text-yellow-400"} />
                                <span className={`text-xs ${request.isBreaching ? "text-red-400" : "text-yellow-400"}`}>
                                  Resolution SLA: {formatSlaTime(request.slaMinutesLeft)}
                                </span>
                              </div>
                              {request.escalatedTo && (
                                <span className="text-xs text-red-400">
                                  → {request.escalatedTo}
                                </span>
                              )}
                            </div>
                            <Progress 
                              value={request.slaPercentage} 
                              className={`h-1 ${
                                request.slaPercentage < 20 
                                  ? "bg-red-950" 
                                  : request.slaPercentage < 50 
                                  ? "bg-amber-950" 
                                  : "bg-emerald-950"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RequestsPage;
