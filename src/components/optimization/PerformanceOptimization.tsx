import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Globe, 
  Database, 
  Image, 
  Code, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Download
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  current: number;
  target: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

const performanceMetrics: PerformanceMetric[] = [
  {
    name: 'First Contentful Paint',
    current: 1.2,
    target: 1.5,
    status: 'good',
    description: 'Time until first content is painted'
  },
  {
    name: 'Largest Contentful Paint',
    current: 2.8,
    target: 2.5,
    status: 'warning',
    description: 'Time until largest content element is painted'
  },
  {
    name: 'Cumulative Layout Shift',
    current: 0.05,
    target: 0.1,
    status: 'good',
    description: 'Measure of visual stability'
  },
  {
    name: 'Total Blocking Time',
    current: 150,
    target: 200,
    status: 'good',
    description: 'Total time blocked by long tasks'
  }
];

const optimizations = [
  {
    category: 'Images',
    icon: Image,
    items: [
      { name: 'WebP Format Conversion', status: 'completed', impact: 'high' },
      { name: 'Lazy Loading Implementation', status: 'completed', impact: 'medium' },
      { name: 'Image Compression', status: 'pending', impact: 'medium' }
    ]
  },
  {
    category: 'Code Splitting',
    icon: Code,
    items: [
      { name: 'Route-based Splitting', status: 'completed', impact: 'high' },
      { name: 'Component Lazy Loading', status: 'completed', impact: 'medium' },
      { name: 'Vendor Bundle Optimization', status: 'in-progress', impact: 'medium' }
    ]
  },
  {
    category: 'Caching',
    icon: Database,
    items: [
      { name: 'Service Worker Implementation', status: 'pending', impact: 'high' },
      { name: 'API Response Caching', status: 'completed', impact: 'medium' },
      { name: 'Static Asset Caching', status: 'completed', impact: 'low' }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good': return 'text-emerald-600 bg-emerald-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'poor': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getOptimizationStatus = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
    case 'in-progress': return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case 'pending': return <Badge variant="outline">Pending</Badge>;
    default: return <Badge variant="secondary">Unknown</Badge>;
  }
};

export const PerformanceOptimization: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runPerformanceAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  }, []);

  const overallScore = Math.round(
    performanceMetrics.reduce((acc, metric) => 
      acc + (metric.current <= metric.target ? 100 : 70), 0
    ) / performanceMetrics.length
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Optimization</h2>
          <p className="text-muted-foreground">
            Monitor and optimize application performance
          </p>
        </div>
        <Button 
          onClick={runPerformanceAnalysis} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Performance Score
              </CardTitle>
              <CardDescription>
                Aggregate score based on Core Web Vitals and other metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold">{overallScore}/100</span>
                <Badge 
                  variant={overallScore >= 90 ? "default" : overallScore >= 75 ? "secondary" : "destructive"}
                  className="px-3 py-1"
                >
                  {overallScore >= 90 ? "Excellent" : overallScore >= 75 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <Progress value={overallScore} className="h-3" />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {performanceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    {metric.name}
                    <div className={`h-3 w-3 rounded-full ${
                      metric.status === 'good' ? 'bg-emerald-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {metric.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {metric.current}{metric.name.includes('Time') ? 's' : ''}</span>
                      <span>Target: {metric.target}{metric.name.includes('Time') ? 's' : ''}</span>
                    </div>
                    <Progress 
                      value={(metric.current / metric.target) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          {optimizations.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Impact: <span className="capitalize">{item.impact}</span>
                        </div>
                      </div>
                      {getOptimizationStatus(item.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Bundle Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Consider tree-shaking unused dependencies to reduce bundle size by ~15%.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  View Bundle Analysis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  CDN Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Implement CDN for static assets to improve global load times.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Configure CDN
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Service Worker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Add service worker for offline functionality and better caching.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Generate SW
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Audit Report</CardTitle>
              <CardDescription>
                Detailed analysis of application performance with actionable insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Last audit: {new Date().toLocaleDateString()}
                </div>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};