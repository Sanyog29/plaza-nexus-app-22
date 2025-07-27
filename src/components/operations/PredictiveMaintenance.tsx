import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wrench, Calendar, TrendingUp, Phone, Mail, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface MaintenanceAlert {
  id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_failure_date: string;
  confidence: number;
  recommended_action: string;
  estimated_cost: number;
  last_service: string;
}

interface VendorContact {
  id: string;
  name: string;
  specialization: string[];
  contact_phone: string;
  contact_email: string;
  response_time: string;
  rating: number;
  availability: 'available' | 'busy' | 'unavailable';
}

export const PredictiveMaintenance: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data for predictive maintenance
  const maintenanceAlerts: MaintenanceAlert[] = [
    {
      id: '1',
      asset_name: 'HVAC Unit A-1',
      asset_type: 'HVAC',
      location: 'Building A - Floor 1',
      risk_level: 'critical',
      predicted_failure_date: '2024-02-15',
      confidence: 94,
      recommended_action: 'Replace compressor unit',
      estimated_cost: 2500,
      last_service: '2023-08-15'
    },
    {
      id: '2',
      asset_name: 'Elevator #2',
      asset_type: 'Elevator',
      location: 'Building B - Main',
      risk_level: 'high',
      predicted_failure_date: '2024-03-01',
      confidence: 87,
      recommended_action: 'Motor bearing replacement',
      estimated_cost: 1800,
      last_service: '2023-12-01'
    },
    {
      id: '3',
      asset_name: 'Fire Safety System',
      asset_type: 'Safety',
      location: 'Building A - All Floors',
      risk_level: 'medium',
      predicted_failure_date: '2024-04-10',
      confidence: 76,
      recommended_action: 'Sensor calibration and battery replacement',
      estimated_cost: 850,
      last_service: '2023-10-20'
    },
    {
      id: '4',
      asset_name: 'Water Pump #1',
      asset_type: 'Plumbing',
      location: 'Building C - Basement',
      risk_level: 'low',
      predicted_failure_date: '2024-06-15',
      confidence: 68,
      recommended_action: 'Routine maintenance and seal inspection',
      estimated_cost: 450,
      last_service: '2023-11-30'
    }
  ];

  const vendorContacts: VendorContact[] = [
    {
      id: '1',
      name: 'TechFlow HVAC Services',
      specialization: ['HVAC', 'Ventilation', 'Air Quality'],
      contact_phone: '+1 (555) 123-4567',
      contact_email: 'service@techflow.com',
      response_time: '2-4 hours',
      rating: 4.8,
      availability: 'available'
    },
    {
      id: '2',
      name: 'Vertical Solutions',
      specialization: ['Elevator', 'Lift Systems', 'Mechanical'],
      contact_phone: '+1 (555) 234-5678',
      contact_email: 'support@verticalsolutions.com',
      response_time: '1-2 hours',
      rating: 4.9,
      availability: 'busy'
    },
    {
      id: '3',
      name: 'SafeGuard Systems',
      specialization: ['Fire Safety', 'Security', 'Emergency Systems'],
      contact_phone: '+1 (555) 345-6789',
      contact_email: 'emergency@safeguard.com',
      response_time: '1 hour',
      rating: 4.7,
      availability: 'available'
    },
    {
      id: '4',
      name: 'AquaTech Plumbing',
      specialization: ['Plumbing', 'Water Systems', 'Pumps'],
      contact_phone: '+1 (555) 456-7890',
      contact_email: 'service@aquatech.com',
      response_time: '3-6 hours',
      rating: 4.6,
      availability: 'available'
    }
  ];

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskTextColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-500';
      case 'busy': return 'text-yellow-500';
      case 'unavailable': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDaysUntilFailure = (date: string) => {
    const today = new Date();
    const failureDate = new Date(date);
    const diffTime = failureDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Predictive Maintenance</h2>
          <p className="text-muted-foreground">AI-powered asset health monitoring and vendor management</p>
        </div>
        <Button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="bg-primary hover:bg-primary/90"
        >
          {isAnalyzing ? (
            <>
              <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as 'week' | 'month' | 'quarter')}>
        <TabsList>
          <TabsTrigger value="week">Next Week</TabsTrigger>
          <TabsTrigger value="month">Next Month</TabsTrigger>
          <TabsTrigger value="quarter">Next Quarter</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          {/* Maintenance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                    <p className="text-2xl font-bold text-foreground">
                      {maintenanceAlerts.filter(a => a.risk_level === 'critical').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold text-foreground">{maintenanceAlerts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(maintenanceAlerts.reduce((acc, alert) => acc + alert.confidence, 0) / maintenanceAlerts.length)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Est. Cost</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${maintenanceAlerts.reduce((acc, alert) => acc + alert.estimated_cost, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Predictive Maintenance Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceAlerts.map((alert) => {
                  const daysUntilFailure = getDaysUntilFailure(alert.predicted_failure_date);
                  return (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground">{alert.asset_name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {alert.location}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getRiskTextColor(alert.risk_level)}>
                            {alert.risk_level.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">
                            {alert.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Asset Type</p>
                          <p className="font-medium text-foreground">{alert.asset_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Predicted Failure</p>
                          <p className="font-medium text-foreground">
                            {daysUntilFailure > 0 ? `${daysUntilFailure} days` : 'Overdue'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. Cost</p>
                          <p className="font-medium text-foreground">${alert.estimated_cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Service</p>
                          <p className="font-medium text-foreground">{new Date(alert.last_service).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded">
                        <p className="text-sm">
                          <span className="font-medium">Recommended Action:</span> {alert.recommended_action}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Progress value={alert.confidence} className="flex-1 mr-4" />
                        <Button size="sm" variant="outline">
                          Schedule Maintenance
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Vendor Contact Directory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorContacts.map((vendor) => (
                  <div key={vendor.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < Math.floor(vendor.rating) ? 'text-yellow-500' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">({vendor.rating})</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={getAvailabilityColor(vendor.availability)}>
                        {vendor.availability}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Specialization</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vendor.specialization.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{vendor.contact_phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{vendor.contact_email}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Response Time: <span className="font-medium text-foreground">{vendor.response_time}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
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