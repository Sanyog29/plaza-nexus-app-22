import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import { AnalyticsLoadingSkeleton } from './AnalyticsLoadingSkeleton';
import { toast } from '@/hooks/use-toast';

interface SecurityMetrics {
  totalIncidents: number;
  resolvedIncidents: number;
  activeShifts: number;
  averageResponseTime: number;
  incidentTrends: { date: string; incidents: number; resolved: number }[];
  shiftCoverage: { date: string; coverage: number }[];
}

export const SecurityAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchSecurityAnalytics();
  }, [dateRange]);

  const fetchSecurityAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const daysBack = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), daysBack));
      const endDate = endOfDay(new Date());

      // Mock data for now - in real implementation would fetch from security_incidents table
      const mockMetrics: SecurityMetrics = {
        totalIncidents: 8,
        resolvedIncidents: 6,
        activeShifts: 2,
        averageResponseTime: 15,
        incidentTrends: Array.from({ length: daysBack }, (_, i) => ({
          date: format(subDays(new Date(), daysBack - i - 1), 'MMM dd'),
          incidents: Math.floor(Math.random() * 3),
          resolved: Math.floor(Math.random() * 2)
        })),
        shiftCoverage: Array.from({ length: daysBack }, (_, i) => ({
          date: format(subDays(new Date(), daysBack - i - 1), 'MMM dd'),
          coverage: 80 + Math.floor(Math.random() * 20)
        }))
      };

      setMetrics(mockMetrics);
    } catch (error: any) {
      console.error('Error fetching security analytics:', error);
      setError(error.message || 'Failed to load security analytics');
      toast({
        title: "Error loading security analytics",
        description: error.message || 'Failed to load security analytics',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyAnalyticsState 
        title="Error Loading Data"
        description={error}
        type="security"
      />
    );
  }

  if (!metrics) {
    return (
      <EmptyAnalyticsState 
        title="No Security Data"
        description="No security data found for the selected time period."
        type="security"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Security Analytics</h2>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {((metrics.resolvedIncidents / metrics.totalIncidents) * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
                <p className="text-2xl font-bold text-foreground">{metrics.activeShifts}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageResponseTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-foreground">Incident Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.incidentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }} 
                />
                <Bar dataKey="incidents" fill="hsl(var(--destructive))" name="Incidents" />
                <Bar dataKey="resolved" fill="hsl(var(--primary))" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-foreground">Shift Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.shiftCoverage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="coverage" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name="Coverage %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};