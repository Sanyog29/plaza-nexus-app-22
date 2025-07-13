import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, AlertTriangle, TrendingUp, Wrench, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MaintenanceRecommendation {
  id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  predicted_failure_date: string;
  confidence_score: number;
  estimated_cost: number;
  recommendation_type: 'preventive' | 'predictive' | 'corrective';
  risk_factors: string[];
  last_maintenance: string;
}

interface MaintenanceMetrics {
  total_assets: number;
  assets_at_risk: number;
  scheduled_maintenance: number;
  cost_savings_potential: number;
  avg_confidence: number;
}

export const PredictiveMaintenanceScheduler: React.FC = () => {
  const [recommendations, setRecommendations] = useState<MaintenanceRecommendation[]>([]);
  const [metrics, setMetrics] = useState<MaintenanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');

  const generateMaintenanceRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch assets data
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'operational');

      if (assetsError) throw assetsError;

      // Fetch maintenance requests for historical analysis
      const { data: maintenanceHistory, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (maintenanceError) throw maintenanceError;

      // Generate predictive recommendations
      const recommendations: MaintenanceRecommendation[] = assets?.map(asset => {
        const assetMaintenanceHistory = maintenanceHistory?.filter(req => 
          req.location === asset.location && req.category_id
        ) || [];

        // Calculate risk factors
        const daysSinceLastService = asset.last_service_date 
          ? Math.floor((Date.now() - new Date(asset.last_service_date).getTime()) / (1000 * 60 * 60 * 24))
          : 365;

        const maintenanceFrequency = assetMaintenanceHistory.length / 12; // requests per month
        const avgResolutionTime = assetMaintenanceHistory.length > 0 
          ? assetMaintenanceHistory.reduce((sum, req) => {
              const resolutionTime = req.completed_at 
                ? new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()
                : 0;
              return sum + resolutionTime;
            }, 0) / assetMaintenanceHistory.length / (1000 * 60 * 60)
          : 24;

        // Risk calculation
        let riskScore = 0;
        const riskFactors: string[] = [];

        if (daysSinceLastService > (asset.service_frequency_months || 12) * 30) {
          riskScore += 30;
          riskFactors.push('Overdue for maintenance');
        }

        if (maintenanceFrequency > 2) {
          riskScore += 25;
          riskFactors.push('High maintenance frequency');
        }

        if (avgResolutionTime > 48) {
          riskScore += 20;
          riskFactors.push('Complex repair history');
        }

        const assetAge = asset.installation_date 
          ? Math.floor((Date.now() - new Date(asset.installation_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
          : 5;

        if (assetAge > 10) {
          riskScore += 15;
          riskFactors.push('Aging equipment');
        }

        if (asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date()) {
          riskScore += 10;
          riskFactors.push('Out of warranty');
        }

        // Determine priority and prediction
        let priority: 'urgent' | 'high' | 'medium' | 'low' = 'low';
        let daysToFailure = 90;

        if (riskScore >= 70) {
          priority = 'urgent';
          daysToFailure = 7;
        } else if (riskScore >= 50) {
          priority = 'high';
          daysToFailure = 30;
        } else if (riskScore >= 30) {
          priority = 'medium';
          daysToFailure = 60;
        }

        const predictedFailureDate = new Date(Date.now() + daysToFailure * 24 * 60 * 60 * 1000);
        const confidence = Math.min(95, Math.max(60, 100 - (riskScore * 0.3)));

        return {
          id: asset.id,
          asset_name: asset.asset_name,
          asset_type: asset.asset_type,
          location: asset.location,
          priority,
          predicted_failure_date: predictedFailureDate.toISOString(),
          confidence_score: confidence,
          estimated_cost: Math.round((500 + (riskScore * 50)) * (priority === 'urgent' ? 2 : priority === 'high' ? 1.5 : 1)),
          recommendation_type: riskScore > 60 ? 'predictive' : riskScore > 30 ? 'preventive' : 'corrective',
          risk_factors: riskFactors,
          last_maintenance: asset.last_service_date || 'Never'
        };
      }) || [];

      // Sort by priority and risk
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.predicted_failure_date).getTime() - new Date(b.predicted_failure_date).getTime();
      });

      // Calculate metrics
      const totalAssets = assets?.length || 0;
      const assetsAtRisk = recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length;
      const scheduledMaintenance = recommendations.filter(r => 
        new Date(r.predicted_failure_date) <= new Date(Date.now() + parseInt(selectedTimeframe) * 24 * 60 * 60 * 1000)
      ).length;
      const costSavingsPotential = recommendations
        .filter(r => r.recommendation_type === 'preventive')
        .reduce((sum, r) => sum + (r.estimated_cost * 0.3), 0);
      const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length;

      setRecommendations(recommendations);
      setMetrics({
        total_assets: totalAssets,
        assets_at_risk: assetsAtRisk,
        scheduled_maintenance: scheduledMaintenance,
        cost_savings_potential: Math.round(costSavingsPotential),
        avg_confidence: Math.round(avgConfidence)
      });

    } catch (error) {
      console.error('Error generating maintenance recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    generateMaintenanceRecommendations();
  }, [generateMaintenanceRecommendations]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <div className="text-2xl font-bold">{metrics?.total_assets || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                <div className="text-2xl font-bold text-destructive">{metrics?.assets_at_risk || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <div className="text-2xl font-bold">{metrics?.scheduled_maintenance || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Savings Potential</p>
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(metrics?.cost_savings_potential || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <div className="text-2xl font-bold">{metrics?.avg_confidence || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="7">Next 7 days</option>
              <option value="30">Next 30 days</option>
              <option value="90">Next 90 days</option>
            </select>
            <Button onClick={generateMaintenanceRecommendations} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.slice(0, 10).map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rec.asset_name}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">{rec.recommendation_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.asset_type} • {rec.location}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Predicted: {new Date(rec.predicted_failure_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Confidence: {rec.confidence_score}%
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Est. Cost: {formatCurrency(rec.estimated_cost)}
                        </span>
                      </div>
                      {rec.risk_factors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rec.risk_factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations
                  .filter(r => new Date(r.predicted_failure_date) <= new Date(Date.now() + parseInt(selectedTimeframe) * 24 * 60 * 60 * 1000))
                  .map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(rec.priority)} />
                        <div>
                          <p className="font-medium">{rec.asset_name}</p>
                          <p className="text-sm text-muted-foreground">{rec.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(rec.predicted_failure_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(rec.estimated_cost)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { priority: 'Urgent', count: recommendations.filter(r => r.priority === 'urgent').length },
                    { priority: 'High', count: recommendations.filter(r => r.priority === 'high').length },
                    { priority: 'Medium', count: recommendations.filter(r => r.priority === 'medium').length },
                    { priority: 'Low', count: recommendations.filter(r => r.priority === 'low').length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={recommendations.slice(0, 10).map((rec, index) => ({
                    asset: rec.asset_name.substring(0, 10),
                    cost: rec.estimated_cost,
                    confidence: rec.confidence_score
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};