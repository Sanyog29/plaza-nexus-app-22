import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Target,
  Cpu,
  BarChart3,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  Database
} from 'lucide-react';

interface MLModel {
  id: string;
  model_name: string;
  model_type: string;
  version: string;
  accuracy_score?: number;
  last_trained_at?: string;
  model_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MLPrediction {
  id: string;
  model_id: string;
  target_type: string;
  target_id?: string;
  prediction_type: string;
  prediction_value: any;
  confidence_score?: number;
  prediction_date: string;
  actual_outcome?: any;
  is_validated: boolean;
}

export const MLIntegrationLayer: React.FC = () => {
  const [models, setModels] = useState<MLModel[]>([]);
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModels, setActiveModels] = useState(0);
  const [averageAccuracy, setAverageAccuracy] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ML models
      const { data: modelsData, error: modelsError } = await supabase
        .from('ml_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (modelsError) throw modelsError;
      setModels(modelsData || []);

      // Fetch recent predictions
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('ml_predictions')
        .select('*')
        .order('prediction_date', { ascending: false })
        .limit(20);

      if (predictionsError) throw predictionsError;
      setPredictions(predictionsData || []);

      // Calculate metrics
      const active = modelsData?.filter(m => m.is_active).length || 0;
      setActiveModels(active);

      const accuracySum = modelsData?.reduce((sum, model) => 
        sum + (model.accuracy_score || 0), 0) || 0;
      const avgAccuracy = modelsData?.length ? accuracySum / modelsData.length : 0;
      setAverageAccuracy(avgAccuracy * 100);

    } catch (error) {
      console.error('Error fetching ML data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ML integration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'failure_prediction':
        return <AlertCircle className="h-4 w-4" />;
      case 'demand_forecast':
        return <TrendingUp className="h-4 w-4" />;
      case 'anomaly_detection':
        return <Eye className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'bg-gray-500/10 text-gray-600';
    if (accuracy > 0.9) return 'bg-green-500/10 text-green-600';
    if (accuracy > 0.8) return 'bg-blue-500/10 text-blue-600';
    if (accuracy > 0.7) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-red-500/10 text-red-600';
  };

  const trainModel = async (modelId: string) => {
    try {
      // In a real implementation, this would trigger model training
      toast({
        title: "Training Started",
        description: "Model training has been initiated. This may take several minutes.",
      });

      // Update the model's last_trained_at timestamp
      const { error } = await supabase
        .from('ml_models')
        .update({ last_trained_at: new Date().toISOString() })
        .eq('id', modelId);

      if (error) throw error;
      
      fetchData();
    } catch (error) {
      console.error('Error training model:', error);
      toast({
        title: "Error",
        description: "Failed to start model training",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold text-purple-600">{activeModels}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold text-blue-600">{averageAccuracy.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predictions/Day</p>
                <p className="text-2xl font-bold text-green-600">1,247</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing Load</p>
                <p className="text-2xl font-bold text-orange-600">67%</p>
              </div>
              <Cpu className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Model Registry</TabsTrigger>
          <TabsTrigger value="predictions">Live Predictions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training Center</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModelTypeIcon(model.model_type)}
                      {model.model_name}
                    </div>
                    <Badge className={model.is_active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}>
                      {model.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{model.model_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Version</p>
                        <p className="font-medium">{model.version}</p>
                      </div>
                    </div>

                    {model.accuracy_score && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Accuracy</span>
                          <span>{(model.accuracy_score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy_score * 100} className="h-2" />
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Last trained: {model.last_trained_at ? 
                            new Date(model.last_trained_at).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => trainModel(model.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retrain
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.map((prediction) => {
                  const model = models.find(m => m.id === prediction.model_id);
                  return (
                    <div key={prediction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getModelTypeIcon(model?.model_type || '')}
                        <div>
                          <p className="font-medium">{model?.model_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {prediction.prediction_type} - {prediction.target_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(prediction.prediction_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prediction.confidence_score && (
                          <Badge variant="outline">
                            {(prediction.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                        {prediction.is_validated ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {predictions.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No predictions found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{model.model_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {model.accuracy_score ? (model.accuracy_score * 100).toFixed(1) : 'N/A'}%
                        </span>
                      </div>
                      <Progress 
                        value={model.accuracy_score ? model.accuracy_score * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Processing Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">245ms</p>
                      <p className="text-sm text-muted-foreground">Avg Response</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">99.2%</p>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>43%</span>
                      </div>
                      <Progress value={43} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Queue Length</span>
                        <span>12 items</span>
                      </div>
                      <Progress value={24} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Training Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Data Quality</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">94.2%</div>
                      <p className="text-sm text-muted-foreground">Clean records</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Training Pipeline</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">3/5</div>
                      <p className="text-sm text-muted-foreground">Models training</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Validation Score</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">87.3%</div>
                      <p className="text-sm text-muted-foreground">Cross validation</p>
                    </div>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Training Queue</h3>
                  {[
                    { model: 'Equipment Failure Predictor', status: 'Training', progress: 67, eta: '15 min' },
                    { model: 'Demand Forecaster', status: 'Queued', progress: 0, eta: '45 min' },
                    { model: 'Anomaly Detector', status: 'Validating', progress: 95, eta: '2 min' }
                  ].map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.model}</span>
                        <Badge variant={item.status === 'Training' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{item.progress}% • ETA: {item.eta}</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};