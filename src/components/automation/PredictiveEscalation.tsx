import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Clock, Users, Brain } from 'lucide-react';
import { useEscalationPredictions } from '@/hooks/useEscalationPredictions';

export const PredictiveEscalation = () => {
  const { 
    predictions, 
    isLoading, 
    getHighRiskPredictions, 
    getPredictionsByRiskLevel,
    getModelAccuracy 
  } = useEscalationPredictions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Escalation Predictions
        </h4>
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground">Loading predictions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const highRiskPredictions = getHighRiskPredictions();
  const { high, medium, low } = getPredictionsByRiskLevel();
  const modelAccuracy = getModelAccuracy();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Escalation Predictions
        </h4>
        <Badge variant="outline" className="text-primary">
          {modelAccuracy}% Accuracy
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-red-400">{high.length}</div>
            <div className="text-xs text-muted-foreground">High Risk</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-yellow-400">{medium.length}</div>
            <div className="text-xs text-muted-foreground">Medium Risk</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">{low.length}</div>
            <div className="text-xs text-muted-foreground">Low Risk</div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Predictions */}
      {highRiskPredictions.length > 0 && (
        <>
          <h5 className="text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            High Risk Requests ({highRiskPredictions.length})
          </h5>
          {highRiskPredictions.slice(0, 3).map((prediction) => (
            <Card key={prediction.id} className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h6 className="font-medium text-white">
                    {prediction.request?.title || `Request ${prediction.request_id.slice(-4)}`}
                  </h6>
                  <Badge variant="destructive">
                    {Math.round(prediction.predicted_escalation_probability * 100)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Escalation Risk</span>
                      <span className="font-medium text-red-400">
                        {Math.round(prediction.predicted_escalation_probability * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={prediction.predicted_escalation_probability * 100} 
                      className="h-2" 
                    />
                  </div>
                  {prediction.recommended_actions && Array.isArray(prediction.recommended_actions) && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Actions:</strong> {prediction.recommended_actions.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {predictions.length === 0 && (
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground">No predictions available</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};