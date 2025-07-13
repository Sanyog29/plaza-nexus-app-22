import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUtilityManagement } from '@/hooks/useUtilityManagement';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';

export const EnhancedAnalytics: React.FC = () => {
  const { readings, meters } = useUtilityManagement();
  const { config } = useSystemSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedUtilityType, setSelectedUtilityType] = useState<string>('all');

  // Calculate consumption trends with forecasting
  const consumptionTrends = useMemo(() => {
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[selectedPeriod];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredReadings = readings.filter(reading => {
      const readingDate = new Date(reading.reading_date);
      // Find meter for this reading
      const meter = meters.find(m => m.id === reading.meter_id);
      const typeMatch = selectedUtilityType === 'all' || meter?.meter_type === selectedUtilityType;
      return readingDate >= cutoffDate && typeMatch;
    });

    // Group by date and calculate daily totals
    const dailyData = new Map();
    filteredReadings.forEach(reading => {
      const date = reading.reading_date;
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          consumption: 0,
          cost: 0,
          readings: 0
        });
      }
      const dayData = dailyData.get(date);
      dayData.consumption += reading.consumption || 0;
      dayData.cost += reading.total_cost || 0;
      dayData.readings += 1;
    });

    return Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [readings, selectedPeriod, selectedUtilityType]);

  // Simple forecasting using linear regression
  const forecastData = useMemo(() => {
    if (!config.features?.forecastingEnabled || consumptionTrends.length < 7) return [];

    const recentData = consumptionTrends.slice(-14); // Use last 14 days for trend
    const avgDailyIncrease = recentData.length > 1 
      ? (recentData[recentData.length - 1].consumption - recentData[0].consumption) / (recentData.length - 1)
      : 0;

    const lastValue = recentData[recentData.length - 1]?.consumption || 0;
    const forecast = [];

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        forecasted_consumption: Math.max(0, lastValue + (avgDailyIncrease * i)),
        confidence: Math.max(0.3, 0.9 - (i * 0.1)) // Decreasing confidence
      });
    }

    return forecast;
  }, [consumptionTrends, config.features?.forecastingEnabled]);

  // Anomaly detection
  const anomalies = useMemo(() => {
    if (!config.features?.anomalyDetectionEnabled) return [];

    const mean = consumptionTrends.reduce((sum, d) => sum + d.consumption, 0) / consumptionTrends.length;
    const stdDev = Math.sqrt(
      consumptionTrends.reduce((sum, d) => sum + Math.pow(d.consumption - mean, 2), 0) / consumptionTrends.length
    );

    return consumptionTrends.filter(d => 
      Math.abs(d.consumption - mean) > (2 * stdDev) // 2 standard deviations
    ).map(d => ({
      ...d,
      severity: Math.abs(d.consumption - mean) > (3 * stdDev) ? 'high' : 'medium'
    }));
  }, [consumptionTrends, config.features?.anomalyDetectionEnabled]);

  // Efficiency metrics
  const efficiencyMetrics = useMemo(() => {
    const totalConsumption = consumptionTrends.reduce((sum, d) => sum + d.consumption, 0);
    const totalCost = consumptionTrends.reduce((sum, d) => sum + d.cost, 0);
    const avgCostPerUnit = totalConsumption > 0 ? totalCost / totalConsumption : 0;

    const trends = consumptionTrends.map((current, index) => {
      if (index === 0) return { ...current, efficiency: 1 };
      const previous = consumptionTrends[index - 1];
      const efficiency = previous.consumption > 0 ? current.consumption / previous.consumption : 1;
      return { ...current, efficiency };
    });

    return {
      totalConsumption,
      totalCost,
      avgCostPerUnit,
      trends,
      avgEfficiency: trends.reduce((sum, t) => sum + t.efficiency, 0) / trends.length
    };
  }, [consumptionTrends]);

  const utilityTypes = ['all', ...new Set(meters.map(m => m.meter_type))];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Enhanced Analytics</h3>
        <div className="flex gap-3">
          <Select value={selectedUtilityType} onValueChange={setSelectedUtilityType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {utilityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Utilities' : type.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Consumption</p>
                <p className="text-2xl font-bold">{efficiencyMetrics.totalConsumption.toFixed(1)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">₹{efficiencyMetrics.totalCost.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Cost/Unit</p>
                <p className="text-2xl font-bold">₹{efficiencyMetrics.avgCostPerUnit.toFixed(2)}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold text-red-500">{anomalies.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Trends with Forecast */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Consumption Trends & Forecast
              {config.features?.forecastingEnabled && (
                <Badge variant="secondary" className="ml-2">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Forecast
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                
                {/* Historical Data */}
                <Area
                  data={consumptionTrends}
                  dataKey="consumption"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
                
                {/* Forecast Data */}
                {config.features?.forecastingEnabled && (
                  <Line
                    data={forecastData}
                    dataKey="forecasted_consumption"
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost vs Consumption Efficiency */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cost Efficiency Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={consumptionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="consumption" 
                  name="Consumption"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  dataKey="cost" 
                  name="Cost"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'consumption' ? `${value} units` : `₹${value}`,
                    name === 'consumption' ? 'Consumption' : 'Cost'
                  ]}
                />
                <Scatter fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection */}
      {config.features?.anomalyDetectionEnabled && anomalies.length > 0 && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Consumption Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-medium">{anomaly.date}</p>
                    <p className="text-sm text-muted-foreground">
                      Consumption: {anomaly.consumption.toFixed(1)} units
                    </p>
                  </div>
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                    {anomaly.severity} anomaly
                  </Badge>
                </div>
              ))}
              {anomalies.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {anomalies.length - 5} more anomalies
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="font-medium">AI Forecasting</p>
            <Badge variant={config.features?.forecastingEnabled ? 'default' : 'secondary'}>
              {config.features?.forecastingEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="font-medium">Anomaly Detection</p>
            <Badge variant={config.features?.anomalyDetectionEnabled ? 'default' : 'secondary'}>
              {config.features?.anomalyDetectionEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="font-medium">Real-time Updates</p>
            <Badge variant={config.features?.realTimeUpdatesEnabled ? 'default' : 'secondary'}>
              {config.features?.realTimeUpdatesEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};