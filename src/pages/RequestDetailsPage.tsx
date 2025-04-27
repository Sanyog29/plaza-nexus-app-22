
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowLeft, Timer, AlertTriangle, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  
  // For now using static data - would be fetched from API in real implementation
  const request = {
    id: requestId,
    title: 'AC not working in Meeting Room B',
    category: 'Maintenance',
    priority: 'high',
    status: 'In Progress',
    createdAt: '2025-04-25T10:30:00',
    updatedAt: '2025-04-25T14:15:00',
    assignedTo: 'Technical Team',
    eta: '2025-04-25T16:30:00',
    description: 'The air conditioning unit is not cooling properly. Temperature is consistently above 26°C.',
    slaMinutesLeft: 102, // 1h 42m left
    slaPercentage: 35, // 35% of SLA time remaining
    isBreaching: false,
    slaDueAt: '2025-04-25T18:30:00',
    autoEscalationRules: [
      { 
        condition: 'SLA < 30 min', 
        action: 'Notify Maintenance Manager',
        status: 'Pending' 
      },
      { 
        condition: 'SLA Breach', 
        action: 'Boost Priority to Critical',
        status: 'Pending'
      },
      { 
        condition: 'SLA Breach + 30 min', 
        action: 'Escalate to Building Manager',
        status: 'Pending'
      },
    ]
  };

  const formatSlaTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Link to="/requests">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{request.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Badge variant="outline">{request.category}</Badge>
                  <Badge 
                    variant={request.priority === 'high' ? 'destructive' : 'default'}
                    className="capitalize"
                  >
                    {request.priority} Priority
                  </Badge>
                </div>
              </div>
              <Badge 
                className="capitalize"
                variant={request.status === 'In Progress' ? 'default' : 'secondary'}
              >
                {request.status}
              </Badge>
            </div>

            {/* SLA Timer Card */}
            {request.status !== 'Completed' && (
              <Card className="bg-card/50 border-yellow-800/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Timer size={18} className="text-yellow-500" />
                      <div>
                        <h3 className="font-medium text-white">SLA Timer</h3>
                        <p className="text-sm text-yellow-400">Resolution SLA: {formatSlaTime(request.slaMinutesLeft)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400">
                      Due: {new Date(request.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  </div>
                  <Progress value={request.slaPercentage} className="mt-3 h-2" />
                </CardContent>
              </Card>
            )}

            {/* Auto Escalation Rules */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 gap-2 bg-card/50 border-red-800/30 hover:bg-red-950/20">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-sm text-red-400">View Auto-Escalation Workflow</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Auto-Escalation Workflow</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    This request will automatically escalate if not resolved within the SLA.
                  </DialogDescription>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condition</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.autoEscalationRules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell>{rule.condition}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <User size={14} className="text-plaza-blue" />
                          {rule.action}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-800/50">
                            {rule.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>Assigned to: {request.assignedTo}</span>
              </div>
              {request.eta && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>ETA: {new Date(request.eta).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-400">{request.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestDetailsPage;
