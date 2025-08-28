
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Camera, XCircle } from 'lucide-react';

interface TicketProgressBarProps {
  status: string;
  acceptedAt?: string;
  startedAt?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completedAt?: string;
}

const TicketProgressBar: React.FC<TicketProgressBarProps> = ({
  status,
  acceptedAt,
  startedAt,
  beforePhotoUrl,
  afterPhotoUrl,
  completedAt
}) => {
  const getStepStatus = (step: string) => {
    switch (step) {
      case 'requested':
        return 'completed';
      case 'assigned':
        return (status === 'assigned' || status === 'in_progress' || status === 'completed') ? 'completed' : (status === 'pending' ? 'current' : 'pending');
      case 'in_progress':
        return (status === 'in_progress' || status === 'completed') ? 'completed' : (status === 'assigned' ? 'current' : 'pending');
      case 'photos_uploaded':
        return (beforePhotoUrl && afterPhotoUrl) ? 'completed' : (status === 'in_progress' ? 'current' : 'pending');
      case 'completed':
        return status === 'completed' ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const steps = [
    {
      key: 'requested',
      label: 'Requested',
      icon: <Clock className="w-4 h-4" />,
      status: getStepStatus('requested')
    },
    {
      key: 'assigned',
      label: 'Assigned',
      icon: <CheckCircle className="w-4 h-4" />,
      status: getStepStatus('assigned')
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: <Clock className="w-4 h-4" />,
      status: getStepStatus('in_progress')
    },
    {
      key: 'photos_uploaded',
      label: 'Photos Uploaded',
      icon: <Camera className="w-4 h-4" />,
      status: getStepStatus('photos_uploaded')
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="w-4 h-4" />,
      status: getStepStatus('completed')
    }
  ];

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-600 text-white';
      case 'current':
        return 'bg-blue-600 text-white';
      case 'pending':
        return 'bg-gray-600 text-gray-300';
      default:
        return 'bg-gray-600 text-gray-300';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.status)} mb-2 relative z-10`}>
              {step.icon}
            </div>
            <span className={`text-xs text-center ${step.status === 'completed' ? 'text-green-400' : step.status === 'current' ? 'text-blue-400' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div 
                className={`absolute top-5 left-1/2 h-0.5 transform -translate-y-1/2 ${
                  steps[index + 1].status === 'completed' ? 'bg-green-600' : 'bg-gray-600'
                }`} 
                style={{ 
                  width: 'calc(100vw / 5 - 40px)', 
                  marginLeft: '20px',
                  zIndex: 1
                }} 
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge className={getStepColor(getStepStatus(status))}>
          {status.replace('_', ' ').toUpperCase()}
        </Badge>
        {beforePhotoUrl && <Badge variant="outline" className="text-green-300">Before Photo ✓</Badge>}
        {afterPhotoUrl && <Badge variant="outline" className="text-green-300">After Photo ✓</Badge>}
      </div>
    </div>
  );
};

export default TicketProgressBar;
