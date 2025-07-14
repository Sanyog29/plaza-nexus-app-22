import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIPredictiveSystem } from '@/hooks/useAIPredictiveSystem';
import { Brain, TrendingUp, AlertTriangle, Zap, RefreshCw, Target, Activity } from 'lucide-react';
import { toast } from 'sonner';

export const AIInsightsDashboard: React.FC = () => {
  const {
    insights,
    automationRules,
    aiModels,
    isLoading,
    generateWorkloadForecast,
    predictMaintenanceNeeds,
    optimizeSLATargets,
    refreshData
  } = useAIPredictiveSystem();

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateForecast = async (timeframe: 'day' | 'week' | 'month') => {
    setIsGenerating(true);
    try {
      await generateWorkloadForecast(timeframe);
      toast.success(`Generated ${timeframe} forecast successfully`);
      refreshData();
    } catch (error) {
      toast.error('Failed to generate forecast');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeSLA = async () => {
    setIsGenerating(true);
    try {
      await optimizeSLATargets();
      toast.success('SLA optimization completed');
      refreshData();
    } catch (error) {
      toast.error('Failed to optimize SLA targets');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading AI insights...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground">
            Predictive insights and intelligent automation
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" disabled={isGenerating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => (
              <Card key={insight.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {insight.insight_type.replace('_', ' ')}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence_score)}`}>
                      {Math.round(insight.confidence_score * 100)}%
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {insight.prediction_data.title || 
                     insight.prediction_data.asset_name || 
                     'System Prediction'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insight.prediction_data.risk_level && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <Badge variant={getSeverityColor(insight.prediction_data.risk_level)}>
                          {insight.prediction_data.risk_level} Risk
                        </Badge>
                      </div>
                    )}
                    
                    {insight.prediction_data.predicted_requests && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">
                          {insight.prediction_data.predicted_requests} requests predicted
                        </span>
                      </div>
                    )}

                    {insight.prediction_data.days_until_due && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">
                          Due in {insight.prediction_data.days_until_due} days
                        </span>
                      </div>
                    )}

                    <Progress value={insight.confidence_score * 100} className="h-2" />
                    
                    {insight.prediction_data.recommended_actions && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2">Recommendations:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {insight.prediction_data.recommended_actions.slice(0, 2).map((action: string, index: number) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {insights.length === 0 && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                No predictive insights available. Generate new forecasts using the Quick Actions tab.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {rule.rule_name}
                    </CardTitle>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {rule.rule_type.replace('_', ' ')} • Priority: {rule.priority}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-2">Trigger Conditions</p>
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        {Object.entries(rule.trigger_conditions).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Actions</p>
                      <div className="text-xs text-muted-foreground">
                        {rule.actions.map((action: any, index: number) => (
                          <div key={index} className="flex items-center gap-1 mb-1">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            {action.type.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {automationRules.length === 0 && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                No automation rules configured. Contact your administrator to set up intelligent workflows.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {model.model_name}
                  </CardTitle>
                  <CardDescription>
                    {model.model_type.replace('_', ' ')} • v{model.version}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accuracy</span>
                      <span className="text-sm font-medium">
                        {Math.round((model.accuracy_score || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(model.accuracy_score || 0) * 100} className="h-2" />
                    <Badge variant={model.is_active ? 'default' : 'secondary'} className="w-full justify-center">
                      {model.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {aiModels.length === 0 && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                No AI models configured. Contact your administrator to enable intelligent features.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Generate Workload Forecast</CardTitle>
                <CardDescription>
                  Predict future request volumes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleGenerateForecast('day')} 
                  disabled={isGenerating} 
                  className="w-full"
                  variant="outline"
                >
                  Daily Forecast
                </Button>
                <Button 
                  onClick={() => handleGenerateForecast('week')} 
                  disabled={isGenerating} 
                  className="w-full"
                  variant="outline"
                >
                  Weekly Forecast
                </Button>
                <Button 
                  onClick={() => handleGenerateForecast('month')} 
                  disabled={isGenerating} 
                  className="w-full"
                  variant="outline"
                >
                  Monthly Forecast
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Optimization</CardTitle>
                <CardDescription>
                  Analyze and optimize SLA targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleOptimizeSLA} 
                  disabled={isGenerating} 
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Optimize SLAs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Predictions</CardTitle>
                <CardDescription>
                  Generate maintenance forecasts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  disabled={isGenerating} 
                  className="w-full"
                  variant="outline"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};