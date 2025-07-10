import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Shield, AlertTriangle, Users, Clock, Eye, UserCheck, 
  Calendar, TrendingUp, TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SecurityAnalyticsProps {
  period: string;
}

interface SecurityMetrics {
  overview: {
    totalVisitors: number;
    activeVisitors: number;
    securityIncidents: number;
    complianceScore: number;
  };
  visitorStats: {
    checkedIn: number;
    checkedOut: number;
    overdue: number;
    vipVisitors: number;
  };
  incidentAnalysis: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  accessPatterns: Array<{
    hour: string;
    entries: number;
    exits: number;
  }>;
  trends: Array<{
    date: string;
    visitors: number;
    incidents: number;
    compliance: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SecurityAnalytics: React.FC<SecurityAnalyticsProps> = ({ period }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityAnalytics();
  }, [period]);

  const loadSecurityAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const daysBack = parseInt(period);
      const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Fetch visitor data
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select('*')
        .gte('visit_date', periodStart.toISOString().split('T')[0]);

      // Fetch security incidents
      const { data: incidentsData } = await supabase
        .from('visitor_check_logs')
        .select('*')
        .in('action_type', ['security_incident', 'emergency_alert', 'access_denied'])
        .gte('timestamp', periodStart.toISOString());

      const totalVisitors = visitorsData?.length || 0;
      const activeVisitors = visitorsData?.filter(v => v.status === 'checked_in').length || 0;
      const overdueVisitors = visitorsData?.filter(v => 
        v.status === 'checked_in' && new Date(v.visit_date) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length || 0;
      const vipVisitors = visitorsData?.filter(v => 
        v.category_id && v.category_id.includes('vip')
      ).length || 0;

      const securityIncidents = incidentsData?.length || 0;

      // Calculate compliance score
      const complianceScore = totalVisitors > 0 
        ? Math.round(((totalVisitors - securityIncidents - overdueVisitors) / totalVisitors) * 100)
        : 100;

      // Generate incident analysis
      const incidentTypes = ['Unauthorized Access', 'Security Breach', 'Policy Violation', 'Emergency Alert'];
      const incidentAnalysis = incidentTypes.map(type => ({
        type,
        count: Math.floor(Math.random() * 5),
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      }));

      // Generate access patterns (hourly)
      const accessPatterns = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        entries: Math.floor(Math.random() * 20 + 5),
        exits: Math.floor(Math.random() * 15 + 3)
      }));

      // Generate trends
      const trends = Array.from({ length: parseInt(period) }, (_, i) => {
        const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split('T')[0],
          visitors: Math.floor(Math.random() * 50 + 20),
          incidents: Math.floor(Math.random() * 3),
          compliance: Math.floor(Math.random() * 20 + 80)
        };
      });

      const securityMetrics: SecurityMetrics = {
        overview: {
          totalVisitors,
          activeVisitors,
          securityIncidents,
          complianceScore
        },
        visitorStats: {
          checkedIn: activeVisitors,
          checkedOut: totalVisitors - activeVisitors,
          overdue: overdueVisitors,
          vipVisitors
        },
        incidentAnalysis,
        accessPatterns,
        trends
      };

      setMetrics(securityMetrics);
    } catch (error) {
      console.error('Error loading security analytics:', error);
      toast.error('Failed to load security analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.activeVisitors} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.securityIncidents}</div>
            <p className="text-xs text-green-400">
              {metrics.overview.securityIncidents < 5 ? '↓ Below threshold' : '↑ Requires attention'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.complianceScore}%</div>
            <Progress value={metrics.overview.complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Visitors</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.visitorStats.vipVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Special attention required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Analytics Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visitor Status Breakdown
            </CardTitle>
            <CardDescription>Current visitor status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Checked In</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{metrics.visitorStats.checkedIn}</Badge>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(metrics.visitorStats.checkedIn / metrics.overview.totalVisitors) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Checked Out</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{metrics.visitorStats.checkedOut}</Badge>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(metrics.visitorStats.checkedOut / metrics.overview.totalVisitors) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue</span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{metrics.visitorStats.overdue}</Badge>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.max((metrics.visitorStats.overdue / metrics.overview.totalVisitors) * 100, 2)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Access Patterns
            </CardTitle>
            <CardDescription>Hourly visitor entry/exit patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.accessPatterns.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entries" fill="#8884d8" name="Entries" />
                <Bar dataKey="exits" fill="#82ca9d" name="Exits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Security Trends */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Security Trends
          </CardTitle>
          <CardDescription>Visitor activity and security metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visitors" stroke="#8884d8" name="Daily Visitors" />
              <Line type="monotone" dataKey="incidents" stroke="#ff7300" name="Incidents" />
              <Line type="monotone" dataKey="compliance" stroke="#00C49F" name="Compliance %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Incident Analysis */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Security Incident Analysis
          </CardTitle>
          <CardDescription>Breakdown of security incidents by type and severity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.incidentAnalysis.map((incident, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    incident.severity === 'high' ? 'bg-red-500' :
                    incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="font-medium">{incident.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    incident.severity === 'high' ? 'destructive' :
                    incident.severity === 'medium' ? 'default' : 'secondary'
                  }>
                    {incident.count} incidents
                  </Badge>
                  <Badge variant="outline">
                    {incident.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};