import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingDown, TrendingUp, Thermometer, Eye, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface EnergyData {
  timestamp: string;
  consumption: number;
  cost: number;
  source: 'grid' | 'solar' | 'battery';
}

interface IoTSensor {
  id: string;
  name: string;
  location: string;
  type: 'temperature' | 'occupancy' | 'light' | 'air_quality';
  value: number;
  unit: string;
  status: 'online' | 'offline' | 'warning';
  last_reading: string;
  optimal_range: { min: number; max: number };
}

interface OptimizationRecommendation {
  id: string;
  category: string;
  description: string;
  potential_savings: number;
  implementation_cost: number;
  payback_period: string;
  priority: 'high' | 'medium' | 'low';
}

export const EnergyManagement: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Mock IoT sensor data
  const iotSensors: IoTSensor[] = [
    {
      id: '1',
      name: 'Zone A Temperature',
      location: 'Building A - Floor 1',
      type: 'temperature',
      value: 22.5,
      unit: '°C',
      status: 'online',
      last_reading: '2024-01-27T10:30:00Z',
      optimal_range: { min: 20, max: 24 }
    },
    {
      id: '2',
      name: 'Conference Room Occupancy',
      location: 'Building B - Floor 2',
      type: 'occupancy',
      value: 8,
      unit: 'people',
      status: 'online',
      last_reading: '2024-01-27T10:29:00Z',
      optimal_range: { min: 0, max: 12 }
    },
    {
      id: '3',
      name: 'Lobby Lighting',
      location: 'Building A - Ground Floor',
      type: 'light',
      value: 450,
      unit: 'lux',
      status: 'warning',
      last_reading: '2024-01-27T10:25:00Z',
      optimal_range: { min: 300, max: 500 }
    },
    {
      id: '4',
      name: 'Office Air Quality',
      location: 'Building C - Floor 3',
      type: 'air_quality',
      value: 650,
      unit: 'ppm CO2',
      status: 'online',
      last_reading: '2024-01-27T10:31:00Z',
      optimal_range: { min: 400, max: 800 }
    }
  ];

  // Mock energy data
  const energyData: EnergyData[] = [
    { timestamp: '08:00', consumption: 45, cost: 12.5, source: 'grid' },
    { timestamp: '09:00', consumption: 52, cost: 14.8, source: 'grid' },
    { timestamp: '10:00', consumption: 48, cost: 13.2, source: 'solar' },
    { timestamp: '11:00', consumption: 55, cost: 8.5, source: 'solar' },
    { timestamp: '12:00', consumption: 62, cost: 9.2, source: 'solar' },
    { timestamp: '13:00', consumption: 58, cost: 8.8, source: 'solar' },
    { timestamp: '14:00', consumption: 53, cost: 8.1, source: 'solar' },
    { timestamp: '15:00', consumption: 49, cost: 13.7, source: 'grid' }
  ];

  const optimizationRecommendations: OptimizationRecommendation[] = [
    {
      id: '1',
      category: 'HVAC Optimization',
      description: 'Implement smart temperature scheduling based on occupancy patterns',
      potential_savings: 2400,
      implementation_cost: 5000,
      payback_period: '2.1 months',
      priority: 'high'
    },
    {
      id: '2',
      category: 'Lighting Automation',
      description: 'Install motion sensors and daylight harvesting systems',
      potential_savings: 1800,
      implementation_cost: 3200,
      payback_period: '1.8 months',
      priority: 'high'
    },
    {
      id: '3',
      category: 'Solar Integration',
      description: 'Expand solar panel capacity and add battery storage',
      potential_savings: 3600,
      implementation_cost: 25000,
      payback_period: '6.9 months',
      priority: 'medium'
    },
    {
      id: '4',
      category: 'Equipment Upgrade',
      description: 'Replace aging equipment with energy-efficient alternatives',
      potential_savings: 1200,
      implementation_cost: 8000,
      payback_period: '6.7 months',
      priority: 'low'
    }
  ];

  const handleOptimizeEnergy = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsOptimizing(false);
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'occupancy': return <Eye className="h-4 w-4" />;
      case 'light': return <Lightbulb className="h-4 w-4" />;
      case 'air_quality': return <Zap className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const isValueInRange = (value: number, range: { min: number; max: number }) => {
    return value >= range.min && value <= range.max;
  };

  const totalConsumption = energyData.reduce((sum, data) => sum + data.consumption, 0);
  const totalCost = energyData.reduce((sum, data) => sum + data.cost, 0);
  const solarUsage = energyData.filter(d => d.source === 'solar').length / energyData.length * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Energy Management</h2>
          <p className="text-muted-foreground">IoT-powered energy monitoring and optimization</p>
        </div>
        <Button 
          onClick={handleOptimizeEnergy}
          disabled={isOptimizing}
          className="bg-primary hover:bg-primary/90"
        >
          {isOptimizing ? (
            <>
              <TrendingDown className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 mr-2" />
              Optimize Energy
            </>
          )}
        </Button>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'day' | 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Energy Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Consumption</p>
                    <p className="text-2xl font-bold text-foreground">{totalConsumption} kWh</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold text-foreground">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solar Usage</p>
                    <p className="text-2xl font-bold text-foreground">{solarUsage.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className="text-2xl font-bold text-foreground">87%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IoT Sensor Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>IoT Sensor Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {iotSensors.map((sensor) => {
                  const isOptimal = isValueInRange(sensor.value, sensor.optimal_range);
                  return (
                    <div key={sensor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          {getSensorIcon(sensor.type)}
                          <div>
                            <h3 className="font-semibold text-foreground">{sensor.name}</h3>
                            <p className="text-sm text-muted-foreground">{sensor.location}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getSensorStatusColor(sensor.status)}>
                          {sensor.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold text-foreground">
                            {sensor.value} <span className="text-sm font-normal text-muted-foreground">{sensor.unit}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Optimal: {sensor.optimal_range.min}-{sensor.optimal_range.max} {sensor.unit}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full ${isOptimal ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Range</span>
                          <span className={isOptimal ? 'text-green-500' : 'text-red-500'}>
                            {isOptimal ? 'Optimal' : 'Out of Range'}
                          </span>
                        </div>
                        <Progress 
                          value={
                            Math.min(
                              Math.max(
                                ((sensor.value - sensor.optimal_range.min) / 
                                (sensor.optimal_range.max - sensor.optimal_range.min)) * 100, 
                                0
                              ), 
                              100
                            )
                          } 
                          className={`h-2 ${isOptimal ? '' : 'bg-red-100'}`}
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Last reading: {new Date(sensor.last_reading).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Energy Consumption Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Energy Consumption Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-foreground min-w-[60px]">
                        {data.timestamp}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          data.source === 'solar' ? 'bg-yellow-500' : 
                          data.source === 'battery' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm text-muted-foreground capitalize">{data.source}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{data.consumption} kWh</p>
                        <p className="text-xs text-muted-foreground">Consumption</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">${data.cost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Cost</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span>Optimization Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationRecommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{rec.category}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Potential Savings</p>
                        <p className="font-medium text-green-500">${rec.potential_savings}/month</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Implementation Cost</p>
                        <p className="font-medium text-foreground">${rec.implementation_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payback Period</p>
                        <p className="font-medium text-foreground">{rec.payback_period}</p>
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" variant="outline" className="w-full">
                          Implement
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};