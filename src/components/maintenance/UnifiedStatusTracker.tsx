import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, MapPin, Wrench, Star, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  step: number;
  status: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
  canTrigger?: boolean;
}

interface UnifiedStatusTrackerProps {
  requestId: string;
  currentStatus: string;
  workflowStep: number;
  isStaff: boolean;
  assignedToUserId?: string;
  timestamps: {
    created_at: string;
    assigned_at?: string;
    en_route_at?: string;
    work_started_at?: string;
    completed_at?: string;
  };
  estimatedArrival?: string;
  onStatusUpdate?: () => void;
}

const UnifiedStatusTracker: React.FC<UnifiedStatusTrackerProps> = ({
  requestId,
  currentStatus,
  workflowStep,
  isStaff,
  assignedToUserId,
  timestamps,
  estimatedArrival,
  onStatusUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const steps: WorkflowStep[] = [
    {
      step: 1,
      status: 'pending',
      label: 'Request Logged',
      icon: <CircleDot className="h-4 w-4" />,
      description: 'Your request has been received and logged in our system',
      timestamp: timestamps.created_at,
      isActive: workflowStep === 1,
      isCompleted: workflowStep > 1,
      canTrigger: false,
    },
    {
      step: 2,
      status: 'assigned',
      label: 'Assigned',
      icon: <Clock className="h-4 w-4" />,
      description: 'A technician has been assigned to your request',
      timestamp: timestamps.assigned_at,
      isActive: workflowStep === 2,
      isCompleted: workflowStep > 2,
      canTrigger: isStaff && workflowStep === 1,
    },
    {
      step: 3,
      status: 'en_route',
      label: 'En Route',
      icon: <MapPin className="h-4 w-4" />,
      description: 'Technician is on the way to your location',
      timestamp: timestamps.en_route_at,
      isActive: workflowStep === 3,
      isCompleted: workflowStep > 3,
      canTrigger: isStaff && workflowStep === 2 && !!assignedToUserId,
    },
    {
      step: 4,
      status: 'in_progress',
      label: 'Work in Progress',
      icon: <Wrench className="h-4 w-4" />,
      description: 'Work has started on resolving your request',
      timestamp: timestamps.work_started_at,
      isActive: workflowStep === 4,
      isCompleted: workflowStep > 4,
      canTrigger: isStaff && workflowStep === 3,
    },
    {
      step: 5,
      status: 'completed',
      label: 'Completed',
      icon: <Star className="h-4 w-4" />,
      description: 'Your request has been successfully resolved',
      timestamp: timestamps.completed_at,
      isActive: workflowStep === 5,
      isCompleted: workflowStep === 5,
      canTrigger: isStaff && workflowStep === 4,
    },
  ];

  const updateStatus = async (newStatus: string) => {
    if (!isStaff) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Request status updated to ${newStatus.replace('_', ' ')}`,
      });

      onStatusUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getProgressPercentage = () => {
    return ((workflowStep - 1) / 4) * 100;
  };

  const getStepColor = (step: WorkflowStep) => {
    if (step.isCompleted) return 'text-green-400 border-green-400 bg-green-400/10';
    if (step.isActive) return 'text-blue-400 border-blue-400 bg-blue-400/10';
    return 'text-gray-500 border-gray-600 bg-gray-800/50';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Request Progress</h3>
        <Progress 
          value={getProgressPercentage()} 
          className="h-2 bg-gray-800"
          indicatorClassName="bg-gradient-to-r from-blue-500 to-green-500"
        />
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:flex items-center justify-between relative mb-6">
        {/* Connection Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-700 -z-10" />
        <div 
          className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 -z-10 transition-all duration-500"
          style={{ width: `${getProgressPercentage()}%` }}
        />

        {steps.map((step, index) => (
          <div key={step.step} className="flex flex-col items-center relative">
            {/* Step Circle */}
            <div className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10 bg-card",
              getStepColor(step)
            )}>
              {step.isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                step.icon
              )}
            </div>

            {/* Step Label */}
            <div className="mt-3 text-center">
              <p className={cn(
                "text-sm font-medium",
                step.isCompleted ? "text-green-400" : 
                step.isActive ? "text-blue-400" : "text-gray-500"
              )}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(step.timestamp).toLocaleString()}
                </p>
              )}
              {step.isActive && estimatedArrival && step.status === 'en_route' && (
                <p className="text-xs text-yellow-400 mt-1">
                  ETA: {new Date(estimatedArrival).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Action Button for Staff */}
            {isStaff && step.canTrigger && (
              <Button
                size="sm"
                onClick={() => updateStatus(step.status)}
                disabled={isUpdating}
                className="mt-2 h-7 text-xs"
                variant="outline"
              >
                Mark {step.label}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.step} className="flex items-start space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              getStepColor(step)
            )}>
              {step.isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                step.icon
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  "text-sm font-medium",
                  step.isCompleted ? "text-green-400" : 
                  step.isActive ? "text-blue-400" : "text-gray-500"
                )}>
                  {step.label}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-gray-400">
                    {new Date(step.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-1">
                {step.description}
              </p>
              
              {step.isActive && estimatedArrival && step.status === 'en_route' && (
                <Badge variant="outline" className="mt-2 text-xs bg-yellow-900/20 text-yellow-400">
                  ETA: {new Date(estimatedArrival).toLocaleTimeString()}
                </Badge>
              )}

              {isStaff && step.canTrigger && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(step.status)}
                  disabled={isUpdating}
                  className="mt-2 h-7 text-xs"
                  variant="outline"
                >
                  Mark {step.label}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-card/50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Status</p>
            <p className="text-lg font-semibold text-white capitalize">
              {currentStatus.replace('_', ' ')}
            </p>
          </div>
          <Badge 
            variant={currentStatus === 'completed' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {currentStatus.replace('_', ' ')}
          </Badge>
        </div>
        
        {!isStaff && (
          <div className="mt-3 text-sm text-gray-400">
            {steps.find(s => s.isActive)?.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedStatusTracker;