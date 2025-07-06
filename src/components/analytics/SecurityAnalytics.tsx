import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Shield, Clock, TrendingUp, AlertTriangle, Download, 
  Users, Timer, Activity, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface SecurityMetrics {
  totalShifts: number;
  activeGuards: number;
  averageShiftDuration: number;
  totalIncidents: number;
  shiftPerformance: { guard: string; shifts: number; totalHours: number; performance: number }[];
  shiftTrends: { date: string; shifts: number; hours: number }[];
  incidentTypes: { type: string; count: number; severity: string }[];
  guardWorkload: { guard: string; workload: number; status: string }[];
}

const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#DC2626'
};

export const SecurityAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchSecurityAnalytics();
  }, [dateRange]);

  const fetchSecurityAnalytics = async () => {
    setLoading(true);
    try {
      const daysBack = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), daysBack));
      const endDate = endOfDay(new Date());

      // Get security shifts data
      const { data: shifts } = await supabase
        .from('security_shifts')
        .select(`
          *,
          profiles!security_shifts_guard_id_fkey (first_name, last_name)
        `)
        .gte('shift_start', startDate.toISOString())
        .lte('shift_start', endDate.toISOString());

      // Get active guards
      const { data: activeShifts } = await supabase
        .from('security_shifts')
        .select('guard_id')
        .is('shift_end', null);

      // Simulate incident data (in real app, this would come from an incidents table)
      const incidents = generateMockIncidents(daysBack);

      if (shifts) {
        const processedMetrics = processSecurityData(shifts, activeShifts?.length || 0, incidents, daysBack);
        setMetrics(processedMetrics);
      }
    } catch (error) {
      console.error('Error fetching security analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockIncidents = (days: number) => {
    const incidents = [];
    const types = ['visitor_issue', 'security_breach', 'equipment_failure', 'emergency_response'];
    const severities = ['low', 'medium', 'high'];
    
    for (let i = 0; i < Math.floor(Math.random() * days * 2); i++) {
      incidents.push({
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        date: subDays(new Date(), Math.floor(Math.random() * days))
      });
    }
    return incidents;
  };

  const processSecurityData = (shifts: any[], activeGuards: number, incidents: any[], daysBack: number): SecurityMetrics => {
    const totalShifts = shifts.length;
    
    // Calculate average shift duration
    const completedShifts = shifts.filter(s => s.shift_end);
    const averageShiftDuration = completedShifts.length > 0
      ? completedShifts.reduce((sum, s) => {
          const duration = new Date(s.shift_end).getTime() - new Date(s.shift_start).getTime();
          return sum + duration;
        }, 0) / completedShifts.length / (1000 * 60 * 60) // hours
      : 0;

    // Guard performance analysis
    const guardData: { [key: string]: { shifts: number; totalHours: number; name: string } } = {};
    
    shifts.forEach(shift => {
      const guardName = `${shift.profiles?.first_name || ''} ${shift.profiles?.last_name || ''}`.trim() || 'Unknown';
      if (!guardData[guardName]) {
        guardData[guardName] = { shifts: 0, totalHours: 0, name: guardName };
      }
      
      guardData[guardName].shifts++;
      
      if (shift.shift_end) {
        const hours = (new Date(shift.shift_end).getTime() - new Date(shift.shift_start).getTime()) / (1000 * 60 * 60);
        guardData[guardName].totalHours += hours;
      }
    });

    const shiftPerformance = Object.values(guardData).map(guard => ({
      guard: guard.name,
      shifts: guard.shifts,
      totalHours: Math.round(guard.totalHours * 10) / 10,
      performance: Math.round((guard.totalHours / guard.shifts) * 10) / 10 // avg hours per shift
    }));

    // Daily shift trends
    const dailyData: { [key: string]: { shifts: number; hours: number } } = {};
    for (let i = 0; i < daysBack; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[date] = { shifts: 0, hours: 0 };
    }
    
    shifts.forEach(shift => {
      const date = format(new Date(shift.shift_start), 'yyyy-MM-dd');
      if (dailyData[date]) {
        dailyData[date].shifts++;
        if (shift.shift_end) {
          const hours = (new Date(shift.shift_end).getTime() - new Date(shift.shift_start).getTime()) / (1000 * 60 * 60);
          dailyData[date].hours += hours;
        }
      }
    });

    const shiftTrends = Object.entries(dailyData)
      .map(([date, data]) => ({ 
        date: format(new Date(date), 'MMM dd'), 
        shifts: data.shifts,
        hours: Math.round(data.hours * 10) / 10
      }))
      .reverse();

    // Incident analysis
    const incidentTypeData: { [key: string]: { count: number; severity: string } } = {};
    incidents.forEach(incident => {
      const type = incident.type.replace('_', ' ').toUpperCase();
      if (!incidentTypeData[type]) {
        incidentTypeData[type] = { count: 0, severity: incident.severity };
      }
      incidentTypeData[type].count++;
    });

    const incidentTypes = Object.entries(incidentTypeData)
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }));

    // Guard workload analysis
    const guardWorkload = shiftPerformance.map(guard => ({
      guard: guard.guard,
      workload: guard.totalHours,
      status: guard.totalHours > 40 ? 'overworked' : guard.totalHours < 20 ? 'underutilized' : 'optimal'
    }));

    return {
      totalShifts,
      activeGuards,
      averageShiftDuration,
      totalIncidents: incidents.length,
      shiftPerformance,
      shiftTrends,
      incidentTypes,
      guardWorkload
    };
  };

  const exportSecurityReport = async () => {
    if (!metrics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} days`,
      metrics,
      summary: {
        totalShifts: metrics.totalShifts,
        activeGuards: metrics.activeGuards,
        averageShiftDuration: metrics.averageShiftDuration.toFixed(1),
        totalIncidents: metrics.totalIncidents,
        incidentRate: (metrics.totalIncidents / metrics.totalShifts).toFixed(2)
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading security analytics...</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Security Analytics</h2>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportSecurityReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Shifts</p>
                <p className="text-2xl font-bold text-white">{metrics.totalShifts}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Guards</p>
                <p className="text-2xl font-bold text-white">{metrics.activeGuards}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Shift Duration</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.averageShiftDuration.toFixed(1)}h
                </p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Incidents</p>
                <p className="text-2xl font-bold text-white">{metrics.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 bg-card/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shift Trends */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Daily Shift Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.shiftTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="shifts" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Number of Shifts"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Total Hours"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Guard Performance */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Guard Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.shiftPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="guard" 
                      stroke="#9CA3AF"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="totalHours" fill="#8B5CF6" name="Total Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Guard Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.shiftPerformance.map((guard, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-plaza-blue/20 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{guard.guard}</p>
                        <p className="text-sm text-gray-400">{guard.shifts} shifts completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{guard.totalHours}h</p>
                      <p className="text-sm text-gray-400">{guard.performance}h avg/shift</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Incident Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.incidentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.incidentTypes.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS] || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Incident Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.incidentTypes.map((incident, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: SEVERITY_COLORS[incident.severity as keyof typeof SEVERITY_COLORS] }}
                        />
                        <span className="text-white">{incident.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{incident.count}</Badge>
                        <Badge 
                          variant={incident.severity === 'high' ? 'destructive' : 'outline'}
                          className="capitalize"
                        >
                          {incident.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Guard Workload Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.guardWorkload.map((guard, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-plaza-blue/20 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{guard.guard}</p>
                        <p className="text-sm text-gray-400">{guard.workload} hours</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        guard.status === 'overworked' ? 'destructive' : 
                        guard.status === 'underutilized' ? 'outline' : 
                        'default'
                      }
                      className="capitalize"
                    >
                      {guard.status}
                    </Badge>
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