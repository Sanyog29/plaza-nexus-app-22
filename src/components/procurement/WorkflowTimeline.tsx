import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Circle, Package, FileCheck, Truck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowTimelineProps {
  requisitionId: string;
  currentStatus: string;
  createdAt: string;
}

interface TimelineStep {
  status: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const WorkflowTimeline = ({ 
  requisitionId, 
  currentStatus, 
  createdAt 
}: WorkflowTimelineProps) => {
  
  const { data: statusHistory } = useQuery({
    queryKey: ['status-history', requisitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_status_history')
        .select('*')
        .eq('requisition_list_id', requisitionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!requisitionId
  });

  const steps: TimelineStep[] = [
    {
      status: 'draft',
      label: 'Draft Created',
      icon: <FileCheck className="h-4 w-4" />,
      description: 'Requisition created by field executive'
    },
    {
      status: 'pending_manager_approval',
      label: 'Pending Approval',
      icon: <Clock className="h-4 w-4" />,
      description: 'Waiting for manager review'
    },
    {
      status: 'manager_approved',
      label: 'Manager Approved',
      icon: <Check className="h-4 w-4" />,
      description: 'Approved and ready for procurement'
    },
    {
      status: 'po_created',
      label: 'PO Created',
      icon: <Package className="h-4 w-4" />,
      description: 'Purchase order generated'
    },
    {
      status: 'in_transit',
      label: 'In Transit',
      icon: <Truck className="h-4 w-4" />,
      description: 'Items being delivered'
    },
    {
      status: 'received',
      label: 'Received',
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Items received at property'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.status === currentStatus);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepDate = (stepStatus: string) => {
    if (!statusHistory) return null;
    const historyEntry = statusHistory.find(h => h.new_status === stepStatus);
    return historyEntry?.created_at;
  };

  const getStepColor = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-600';
      case 'current':
        return 'text-primary bg-primary/10 border-primary';
      case 'pending':
        return 'text-muted-foreground bg-muted border-muted-foreground/30';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const stepDate = getStepDate(step.status);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.status} className="relative">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${getStepColor(stepStatus)}`}
                  >
                    {stepStatus === 'completed' ? (
                      <Check className="h-4 w-4" />
                    ) : stepStatus === 'current' ? (
                      <Clock className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${
                        stepStatus === 'completed' ? 'text-green-600' : 
                        stepStatus === 'current' ? 'text-primary' : 
                        'text-muted-foreground'
                      }`}>
                        {step.label}
                      </h4>
                      {stepStatus !== 'pending' && (
                        <Badge variant={stepStatus === 'completed' ? 'default' : 'secondary'}>
                          {stepStatus === 'completed' ? 'Done' : 'In Progress'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {step.description}
                    </p>
                    {stepDate && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(stepDate), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div 
                    className={`absolute left-4 top-8 w-0.5 h-6 -ml-px ${
                      stepStatus === 'completed' ? 'bg-green-600' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
