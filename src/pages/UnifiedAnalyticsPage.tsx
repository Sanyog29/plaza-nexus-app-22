import React, { useState, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Activity, 
  Users, 
  Shield, 
  FileText, 
  TrendingUp,
  DollarSign,
  Clock,
  RefreshCw
} from 'lucide-react';

// Lazy load analytics components for better performance
const AdvancedAnalytics = lazy(() => import('@/components/admin/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const ExecutiveDashboard = lazy(() => import('@/components/analytics/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const SystemHealthDashboard = lazy(() => import('@/components/admin/SystemHealthDashboard'));
const VisitorAnalytics = lazy(() => import('@/components/analytics/VisitorAnalytics').then(m => ({ default: m.VisitorAnalytics })));
const SecurityAnalytics = lazy(() => import('@/components/analytics/SecurityAnalytics').then(m => ({ default: m.SecurityAnalytics })));
const CostControlSystem = lazy(() => import('@/components/analytics/CostControlSystem').then(m => ({ default: m.CostControlSystem })));
const ReportGenerator = lazy(() => import('@/components/reports/ReportGenerator').then(m => ({ default: m.ReportGenerator })));

const UnifiedAnalyticsPage = () => {
  const { isAdmin, isStaff, userRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Redirect non-admin/staff users
  if (!isAdmin && !isStaff) {
    return <Navigate to="/" replace />;
  }

  const analyticsModules = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Key performance indicators and system metrics',
      icon: BarChart3,
      color: 'text-blue-500',
      accessLevel: 'staff'
    },
    {
      id: 'health',
      title: 'System Health',
      description: 'Real-time system monitoring and alerts',
      icon: Activity,
      color: 'text-green-500',
      accessLevel: 'admin'
    },
    {
      id: 'maintenance',
      title: 'Maintenance Analytics',
      description: 'Request patterns and performance metrics',
      icon: TrendingUp,
      color: 'text-purple-500',
      accessLevel: 'staff'
    },
    {
      id: 'visitors',
      title: 'Visitor Analytics',
      description: 'Visitor patterns and building usage',
      icon: Users,
      color: 'text-indigo-500',
      accessLevel: 'admin'
    },
    {
      id: 'security',
      title: 'Security Analytics',
      description: 'Security events and compliance monitoring',
      icon: Shield,
      color: 'text-red-500',
      accessLevel: 'admin'
    },
    {
      id: 'executive',
      title: 'Executive Dashboard',
      description: 'High-level business metrics and KPIs',
      icon: DollarSign,
      color: 'text-yellow-500',
      accessLevel: 'admin'
    },
    {
      id: 'costs',
      title: 'Cost Control',
      description: 'Budget tracking and cost optimization',
      icon: DollarSign,
      color: 'text-orange-500',
      accessLevel: 'admin'
    },
    {
      id: 'reports',
      title: 'Report Generator',
      description: 'Custom reports and data exports',
      icon: FileText,
      color: 'text-gray-500',
      accessLevel: 'staff'
    }
  ];

  // Filter modules based on user access level
  const availableModules = analyticsModules.filter(module => {
    if (module.accessLevel === 'admin') return isAdmin;
    if (module.accessLevel === 'staff') return isStaff || isAdmin;
    return true;
  });

  const LoadingFallback = ({ message = 'Loading analytics...' }: { message?: string }) => (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-8">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">{message}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">
          Analytics & Insights Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive analytics across all system modules and business areas
        </p>
      </div>

      {/* Analytics Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableModules.slice(0, 4).map((module) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={module.id} 
              className="bg-card/50 backdrop-blur hover:bg-card/70 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedTab(module.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <IconComponent className={`h-5 w-5 ${module.color}`} />
                  {module.accessLevel === 'admin' && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm text-white">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-card/50">
          {availableModules.map((module) => (
            <TabsTrigger 
              key={module.id} 
              value={module.id} 
              className="data-[state=active]:bg-primary text-xs"
            >
              {module.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Analytics Overview
                </CardTitle>
                <CardDescription>
                  Quick access to all analytics modules and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableModules.map((module) => {
                    const IconComponent = module.icon;
                    return (
                      <div 
                        key={module.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedTab(module.id)}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`h-4 w-4 ${module.color}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{module.title}</p>
                            <p className="text-xs text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Quick Insights
                </CardTitle>
                <CardDescription>
                  Real-time analytics summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Analytics Modules</span>
                    <Badge variant="default">{availableModules.length}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Access Level</span>
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "Admin" : "Staff"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Real-time Updates</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading system health analytics..." />}>
            <SystemHealthDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading maintenance analytics..." />}>
            <AdvancedAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading visitor analytics..." />}>
            <VisitorAnalytics period="30" />
          </Suspense>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading security analytics..." />}>
            <SecurityAnalytics period="30" />
          </Suspense>
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading executive dashboard..." />}>
            <ExecutiveDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading cost analytics..." />}>
            <CostControlSystem />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Suspense fallback={<LoadingFallback message="Loading report generator..." />}>
            <ReportGenerator />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Analytics last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default UnifiedAnalyticsPage;