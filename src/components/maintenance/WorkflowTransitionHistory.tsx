import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, ArrowRight } from 'lucide-react';
import { useWorkflowTransitions } from '@/hooks/useWorkflowTransitions';

interface WorkflowTransitionHistoryProps {
  requestId: string;
  isStaff: boolean;
}

const WorkflowTransitionHistory: React.FC<WorkflowTransitionHistoryProps> = ({
  requestId,
  isStaff
}) => {
  const { transitions, isLoading } = useWorkflowTransitions(requestId);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (transitions.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 text-yellow-400';
      case 'assigned': return 'bg-blue-900/20 text-blue-400';
      case 'en_route': return 'bg-orange-900/20 text-orange-400';
      case 'in_progress': return 'bg-purple-900/20 text-purple-400';
      case 'completed': return 'bg-green-900/20 text-green-400';
      case 'cancelled': return 'bg-red-900/20 text-red-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-white">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transitions.map((transition, index) => (
            <div 
              key={transition.id} 
              className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg"
            >
              <div className="flex-shrink-0 mt-1">
                {transition.from_status ? (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {transition.from_status && (
                    <>
                      <Badge variant="outline" className={getStatusColor(transition.from_status)}>
                        {formatStatus(transition.from_status)}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </>
                  )}
                  <Badge variant="outline" className={getStatusColor(transition.to_status)}>
                    {formatStatus(transition.to_status)}
                  </Badge>
                </div>
                
                {transition.notes && (
                  <p className="text-sm text-gray-300 mb-2">
                    {transition.notes}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(transition.changed_at).toLocaleString()}</span>
                  </div>
                  
                  {isStaff && transition.changed_by && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>Updated by staff</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowTransitionHistory;