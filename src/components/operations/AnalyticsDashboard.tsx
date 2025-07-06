import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const AnalyticsDashboard: React.FC = () => {
  const {
    currentMetrics,
    isLoading,
    generateSummary,
    getMaintenanceKPIs,
    getUtilityKPIs,
    getStaffKPIs,
    getTrendData
  } = useAnalyticsDashboard();

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const maintenanceKPIs = getMaintenanceKPIs();
  const utilityKPIs = getUtilityKPIs();
  const staffKPIs = getStaffKPIs();

  const handleGenerateSummary = () => {
    generateSummary(new Date(), selectedPeriod);
  };

  const maintenanceTrend = getTrendData('maintenance', 'total_requests', 7);
  const utilityCostTrend = getTrendData('utilities', 'total_cost', 7);

  const pieData = maintenanceKPIs ? [
    { name: 'Urgent', value: maintenanceKPIs.priorityBreakdown.urgent, color: COLORS[3] },
    { name: 'High', value: maintenanceKPIs.priorityBreakdown.high, color: COLORS[2] },
    { name: 'Medium', value: maintenanceKPIs.priorityBreakdown.medium, color: COLORS[0] },
    { name: 'Low', value: maintenanceKPIs.priorityBreakdown.low, color: COLORS[1] }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive facility performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="border-border text-foreground hover:bg-accent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {maintenanceKPIs && (
          <>
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold text-foreground">{maintenanceKPIs.totalRequests}</p>
                    <p className="text-xs text-muted-foreground mt-1">Today</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold text-foreground">{maintenanceKPIs.completionRate}%</p>
                    <div className="flex items-center mt-1">
                      {maintenanceKPIs.completionRate >= 80 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className="text-xs text-muted-foreground">vs yesterday</span>
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Completion</p>
                    <p className="text-2xl font-bold text-foreground">{maintenanceKPIs.avgCompletionTime}h</p>
                    <p className="text-xs text-muted-foreground mt-1">Average time</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Compliance</p>
                    <p className="text-2xl font-bold text-foreground">{maintenanceKPIs.slaCompliance}%</p>
                    <Badge 
                      className={`mt-1 ${maintenanceKPIs.slaCompliance >= 95 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                    >
                      {maintenanceKPIs.slaCompliance >= 95 ? 'Good' : 'Needs Attention'}
                    </Badge>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {utilityKPIs && (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Utility Costs</p>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xl font-bold text-foreground">₹{utilityKPIs.totalCost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{utilityKPIs.readingsCount} readings today</p>
            </CardContent>
          </Card>
        )}

        {staffKPIs && (
          <>
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-foreground">{staffKPIs.activeStaff}</p>
                <p className="text-xs text-muted-foreground">{staffKPIs.totalHours}h total today</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-xl font-bold text-foreground">{staffKPIs.completedTasks}</p>
                <p className="text-xs text-muted-foreground">{staffKPIs.completedChecklists} checklists</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">Request Trends (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={maintenanceTrend}>
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
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilities" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Utility Cost Trends (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={utilityCostTrend}>
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
                    formatter={(value) => [`₹${value}`, 'Cost']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {utilityKPIs && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">Utility Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(utilityKPIs.byType).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.consumption.toFixed(2)} units • {data.readings} readings
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{data.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {staffKPIs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{staffKPIs.activeStaff}</p>
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{staffKPIs.totalHours}h</p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{staffKPIs.completedChecklists}</p>
                  <p className="text-sm text-muted-foreground">Checklists</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{staffKPIs.completedTasks}</p>
                  <p className="text-sm text-muted-foreground">Tasks Done</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Staff Efficiency Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {staffKPIs && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Average Hours per Staff</p>
                      <p className="text-sm text-muted-foreground">Daily average working hours</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{staffKPIs.avgHoursPerStaff}h</p>
                      <Badge className="bg-green-500/10 text-green-500">
                        {staffKPIs.avgHoursPerStaff >= 8 ? 'On Track' : 'Below Target'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Task Completion Rate</p>
                      <p className="text-sm text-muted-foreground">Tasks completed vs assigned</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {staffKPIs.completedTasks > 0 ? '100%' : '0%'}
                      </p>
                      <Badge className="bg-blue-500/10 text-blue-500">Excellent</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};