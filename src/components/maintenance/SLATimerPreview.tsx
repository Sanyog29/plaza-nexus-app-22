
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface SLATimerPreviewProps {
  estimatedTime: number;
}

const SLATimerPreview: React.FC<SLATimerPreviewProps> = ({ estimatedTime }) => {
  return (
    <div className="space-y-2 bg-card/50 backdrop-blur p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <Label>Estimated Resolution Time</Label>
        <Badge 
          variant="outline" 
          className={estimatedTime > 60 ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400"}
        >
          {estimatedTime > 60 ? (
            <CheckCircle size={14} className="mr-1" />
          ) : (
            <AlertTriangle size={14} className="mr-1" />
          )}
          {Math.floor(estimatedTime / 60)}h {estimatedTime % 60}m
        </Badge>
      </div>
      <Progress value={Math.min(100, (estimatedTime / 240) * 100)} className="h-2" />
      <p className="text-xs text-gray-400 mt-1">
        Based on similar requests, this issue typically takes around {Math.floor(estimatedTime / 60)} hours and {estimatedTime % 60} minutes to resolve.
      </p>
    </div>
  );
};

export default SLATimerPreview;
