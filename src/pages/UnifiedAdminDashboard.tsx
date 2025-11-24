import React, { Suspense, lazy, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import { useRequestCounts } from '@/hooks/useRequestCounts';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { getRoleLevel } from '@/constants/roles';
import { PropertySelector } from '@/components/analytics/PropertySelector';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Brain,
  Settings,
  BarChart3,
  Search,
  BookOpen,
  AlertCircle,
  FileText,
  CreditCard,
  Lock,
  Monitor,
  Package,
  UserCheck,
  Globe,
  Plus,
  Building2
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

// Lazy load components for better performance
const AdvancedAnalytics = lazy(() => import('@/components/admin/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const ExecutiveDashboard = lazy(() => import('@/components/analytics/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const SystemHealthDashboard = lazy(() => import('@/components/admin/SystemHealthDashboard'));

const UnifiedSettingsPage = lazy(() => import('@/pages/UnifiedSettingsPage'));
const QualityControlPage = lazy(() => import('@/pages/admin/QualityControlPage'));
const BulkOperationsPage = lazy(() => import('@/pages/BulkOperationsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
const VisitorManagementPage = lazy(() => import('@/pages/VisitorManagementPage'));
const PropertyManagementPage = lazy(() => import('@/pages/admin/PropertyManagementPage'));

const UnifiedAdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, userRole } = useAuth();
  const { currentProperty } = usePropertyContext();
  const roleLevel = getRoleLevel(userRole);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use currentProperty directly from context (no local state)
  const effectivePropertyId = currentProperty?.id ?? null;
  
  // Debug logging
  console.log('[UnifiedAdminDashboard] currentProperty:', currentProperty?.id);
  console.log('[UnifiedAdminDashboard] effectivePropertyId:', effectivePropertyId);
  
  const { 
    metrics, 
    isLoading, 
    error, 
    isRealTimeActive, 
    lastFetch,
    refreshMetrics,
    getHealthSummary 
  } = useOptimizedAdminMetrics(effectivePropertyId);
  
  const { counts: requestCounts } = useRequestCounts(effectivePropertyId);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">You need admin privileges to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const healthSummary = getHealthSummary();

  // Featured tools with enhanced descriptions
  const featuredTools = [
    {
      title: "Create Request",
      description: "Submit a new service or maintenance request",
      icon: Plus,
      route: "/requests/new",
      color: "text-blue-500",
      isExternal: true
    },
    {
      title: "System Health",
      description: "Real-time monitoring, alerts, and performance analytics",
      icon: Monitor,
      route: "health",
      color: "text-green-500",
      badge: isRealTimeActive ? "Live" : "Offline",
      badgeVariant: isRealTimeActive ? "default" : "secondary"
    },
    {
      title: "Advanced Analytics",
      description: "Performance metrics, trends, and insights",
      icon: BarChart3,
      route: "analytics",
      color: "text-blue-500",
      badge: "Enhanced"
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      route: "/admin/users",
      color: "text-purple-500",
      isExternal: true
    },
    {
      title: "Quality Control",
      description: "Service quality monitoring and improvement",
      icon: CheckCircle,
      route: "quality",
      color: "text-emerald-500",
      badge: "New"
    },
    {
      title: "Bulk Operations",
      description: "Mass data operations and batch processing",
      icon: Package,
      route: "bulk",
      color: "text-orange-500"
    },
    {
      title: "Audit Logs",
      description: "Security and compliance tracking",
      icon: FileText,
      route: "audit",
      color: "text-red-500"
    },
    {
      title: "Property Management",
      description: "Manage properties and assignments",
      icon: Building2,
      route: "properties",
      color: "text-cyan-500",
      badge: "Multi-Property"
    },
    {
      title: "Settings",
      description: "System configuration and preferences",
      icon: Settings,
      route: "settings",
      color: "text-gray-500"
    },
    {
      title: "Visitor Management",
      description: "Track and manage building visitors",
      icon: UserCheck,
      route: "visitors",
      color: "text-indigo-500"
    }
  ];

  const quickStats = [
    {
      title: 'Active Requests',
      value: requestCounts.activeRequests,
      icon: Clock,
      color: metrics.urgentRequests > 0 ? 'text-red-500' : 'text-blue-500',
      change: metrics.urgentRequests > 0 ? `${metrics.urgentRequests} urgent` : 'Normal load'
    },
    {
      title: 'Completed',
      value: requestCounts.completedRequests,
      icon: CheckCircle,
      color: 'text-green-500',
      change: `Avg ${metrics.avgResponseTime}m response`
    },
    {
      title: 'Completion Rate',
      value: requestCounts.totalRequests > 0 
        ? ((requestCounts.completedRequests / requestCounts.totalRequests) * 100).toFixed(1) + '%'
        : '0.0%',
      icon: CheckCircle,
      color: (() => {
        const rate = requestCounts.totalRequests > 0 
          ? (requestCounts.completedRequests / requestCounts.totalRequests) * 100 
          : 0;
        return rate >= 90 ? 'text-green-500' : rate >= 70 ? 'text-yellow-500' : 'text-red-500';
      })(),
      change: requestCounts.totalRequests > 0 
        ? `${requestCounts.completedRequests} of ${requestCounts.totalRequests} closed`
        : 'No requests yet'
    },
    {
      title: 'Staff Utilization',
      value: metrics.staffUtilization + '%',
      icon: Users,
      color: 'text-blue-500',
      change: 'Balanced workload'
    }
  ];

  const handleToolClick = (tool: typeof featuredTools[0]) => {
    if (tool.isExternal) {
      navigate(tool.route);
    } else {
      setActiveTab(tool.route);
    }
  };

  return (
    <>
      <SEOHead
        title="Unified Admin Dashboard"
        description="Complete system management and monitoring hub."
        url={`${window.location.origin}/admin/dashboard`}
        type="website"
        noindex
      />
      <LoadingWrapper loading={isLoading} error={error ? new Error(error) : null}>
        <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Unified Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete system management and monitoring hub
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={isRealTimeActive ? "default" : "secondary"}>
              {isRealTimeActive ? "Live" : "Offline"}
            </Badge>
            
            {/* Property Selector for L3 and L4+ roles */}
            {(roleLevel === 'L3' || roleLevel === 'L4+') && (
              <PropertySelector variant="header" />
            )}
            
            {/* Refresh button for L2/L1 or as icon for others */}
            {(roleLevel === 'L2' || roleLevel === 'L1') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMetrics}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Property Context Indicator for L2/L1 */}
        {effectivePropertyId && (roleLevel === 'L2' || roleLevel === 'L1') && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {currentProperty?.name}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {roleLevel === 'L2' ? 'Department View' : 'Field View'}
            </Badge>
          </div>
        )}

        {/* Critical Alerts */}
        {(metrics.urgentRequests > 0 || metrics.slaBreaches > 0 || metrics.criticalAlerts > 0) && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {metrics.urgentRequests > 0 && (
                      <Badge variant="destructive">
                        {metrics.urgentRequests} Urgent Requests
                      </Badge>
                    )}
                    {metrics.slaBreaches > 0 && (
                      <Badge variant="destructive">
                        {metrics.slaBreaches} SLA Breaches
                      </Badge>
                    )}
                    {metrics.criticalAlerts > 0 && (
                      <Badge variant="destructive">
                        {metrics.criticalAlerts} Critical Alerts
                      </Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('/admin/requests')}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-10 bg-card/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Health
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="executive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Executive
            </TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Quality
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Bulk Ops
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Audit
            </TabsTrigger>
            <TabsTrigger value="visitors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Visitors
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Properties
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {quickStats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={stat.title} className="bg-card/50 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                      <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </div>
                        <IconComponent className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Featured Tools Grid */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Admin Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {featuredTools.map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <Card 
                      key={tool.title} 
                      className="bg-card/50 backdrop-blur hover:bg-card/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleToolClick(tool)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <IconComponent className={`h-6 w-6 ${tool.color}`} />
                          {tool.badge && (
                            <Badge variant={tool.badgeVariant as any || "secondary"} className="text-xs">
                              {tool.badge}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                          {tool.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm">
                          {tool.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Health Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Status</span>
                      <Badge variant={
                        healthSummary.overall === 'healthy' ? 'default' :
                        healthSummary.overall === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {healthSummary.overall}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>System Uptime</span>
                        <span>{metrics.systemUptime.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.systemUptime} className="h-2" />
                    </div>

                    {healthSummary.issues.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-yellow-500">Issues:</p>
                        {healthSummary.issues.slice(0, 3).map((issue, index) => (
                          <p key={index} className="text-xs text-muted-foreground">• {issue}</p>
                        ))}
                        {healthSummary.issues.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {healthSummary.issues.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{metrics.optimizationScore}%</span>
                        <Database className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{metrics.avgResponseTime}m</span>
                        <Zap className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last Backup</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {metrics.lastBackup ? 
                            new Date(metrics.lastBackup).toLocaleDateString() : 
                            'None'
                          }
                        </span>
                        <HardDrive className={`h-4 w-4 ${
                          metrics.backupHealth === 'good' ? 'text-green-500' : 'text-yellow-500'
                        }`} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <SystemHealthDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <AdvancedAnalytics />
            </Suspense>
          </TabsContent>

          <TabsContent value="executive" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <ExecutiveDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <QualityControlPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <BulkOperationsPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <AuditLogsPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <VisitorManagementPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <PropertyManagementPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin" /></div>}>
              <UnifiedSettingsPage />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Last updated: {lastFetch ? new Date(lastFetch).toLocaleString() : 'Never'}</p>
          <p>Real-time monitoring: {isRealTimeActive ? 'Active' : 'Inactive'}</p>
        </div>
      </div>
    </LoadingWrapper>
    </>
  );
};

export default UnifiedAdminDashboard;