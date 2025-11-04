import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface PrioritySelectorProps {
  value: 'low' | 'normal' | 'high' | 'urgent';
  onChange: (value: 'low' | 'normal' | 'high' | 'urgent') => void;
}

const priorities = [
  {
    value: 'low',
    label: 'Low',
    description: 'No rush, can wait 2+ weeks',
    icon: Clock,
    color: 'text-muted-foreground',
  },
  {
    value: 'normal',
    label: 'Normal',
    description: 'Standard delivery (1-2 weeks)',
    icon: AlertCircle,
    color: 'text-blue-500',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Needed within a week',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Critical - needed ASAP',
    icon: Zap,
    color: 'text-red-500',
  },
];

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <Label>Priority</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-4 mt-2">
        {priorities.map((priority) => {
          const Icon = priority.icon;
          return (
            <div key={priority.value} className="relative">
              <RadioGroupItem
                value={priority.value}
                id={priority.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={priority.value}
                className="flex flex-col items-start p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${priority.color}`} />
                  <span className="font-semibold">{priority.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {priority.description}
                </span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
