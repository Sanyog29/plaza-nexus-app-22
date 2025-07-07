import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Clock, Users } from 'lucide-react';

export const PredictiveEscalation = () => {
  const [predictions] = useState([
    {
      id: 'req-001',
      title: 'HVAC Unit B3 Repair',
      escalationProbability: 78,
      timeToEscalation: '2.3 hours',
      factors: ['Staff unavailable', 'Complex issue'],
      recommendation: 'Assign additional technician'
    }
  ]);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Escalation Predictions
      </h4>
      {predictions.map((prediction) => (
        <Card key={prediction.id} className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-medium text-white">{prediction.title}</h5>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Escalation Probability</span>
                <span className="font-medium text-red-400">{prediction.escalationProbability}%</span>
              </div>
              <Progress value={prediction.escalationProbability} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};