import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  BarChart3,
  Users,
  Wrench,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { useAdvancedReporting } from '@/hooks/useAdvancedReporting';
import { formatDistanceToNow } from 'date-fns';

export const CrossModuleInsights: React.FC = () => {
  const { 
    kpis, 
    insights, 
    loading, 
    calculateKPIs, 
    generateInsights,
    refreshData 
  } = useAdvancedReporting();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <TrendingDown className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operations':
        return <Wrench className="h-5 w-5" />;
      case 'human_resources':
        return <Users className="h-5 w-5" />;
      case 'service_delivery':
        return <ShoppingCart className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cross-Module Intelligence</h2>
          <p className="text-muted-foreground">AI-powered insights from integrated operational data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateKPIs} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Update KPIs
          </Button>
          <Button onClick={generateInsights} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.kpi_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              {getTrendIcon(kpi.trend_direction)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.current_value.toFixed(1)}
                {kpi.kpi_name.includes('rate') || kpi.kpi_name.includes('efficiency') ? '%' : ''}
              </div>
              {kpi.target_value && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Target: {kpi.target_value}
                  </div>
                  <Progress 
                    value={(kpi.current_value / kpi.target_value) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Updated {formatDistanceToNow(new Date(kpi.last_calculated), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cross-Module Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>
            Intelligent analysis of cross-module performance and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No insights available. Click "Generate Insights" to analyze your data.</p>
              </div>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(insight.category)}
                      <div>
                        <h3 className="text-lg font-semibold">{insight.title}</h3>
                        <p className="text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                    <Badge variant={getImpactColor(insight.impact) as any} className="flex items-center gap-1">
                      {getImpactIcon(insight.impact)}
                      {insight.impact} impact
                    </Badge>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {Object.entries(insight.metrics).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">
                          {typeof value === 'number' ? value.toFixed(1) : value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};