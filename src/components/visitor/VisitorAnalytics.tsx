import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Building,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface VisitorStats {
  totalVisitors: number;
  averageVisitDuration: number;
  peakHour: string;
  repeatVisitors: number;
  noShows: number;
  securityIncidents: number;
}

export const VisitorAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    totalVisitors: 0,
    averageVisitDuration: 0,
    peakHour: '',
    repeatVisitors: 0,
    noShows: 0,
    securityIncidents: 0
  });

  const dailyVisitors = [
    { day: 'Mon', visitors: 23, approved: 21, denied: 2 },
    { day: 'Tue', visitors: 34, approved: 32, denied: 2 },
    { day: 'Wed', visitors: 28, approved: 26, denied: 2 },
    { day: 'Thu', visitors: 41, approved: 38, denied: 3 },
    { day: 'Fri', visitors: 52, approved: 49, denied: 3 },
    { day: 'Sat', visitors: 15, approved: 14, denied: 1 },
    { day: 'Sun', visitors: 8, approved: 8, denied: 0 }
  ];

  const hourlyTraffic = [
    { hour: '08:00', count: 5 },
    { hour: '09:00', count: 12 },
    { hour: '10:00', count: 18 },
    { hour: '11:00', count: 15 },
    { hour: '12:00', count: 8 },
    { hour: '13:00', count: 6 },
    { hour: '14:00', count: 22 },
    { hour: '15:00', count: 19 },
    { hour: '16:00', count: 14 },
    { hour: '17:00', count: 7 }
  ];

  const visitorPurpose = [
    { name: 'Business Meeting', value: 35, color: '#8884d8' },
    { name: 'Interview', value: 25, color: '#82ca9d' },
    { name: 'Delivery', value: 20, color: '#ffc658' },
    { name: 'Maintenance', value: 12, color: '#ff7c7c' },
    { name: 'Other', value: 8, color: '#8dd1e1' }
  ];

  const securityMetrics = [
    { metric: 'QR Verifications', value: 98.5, trend: 'up' },
    { metric: 'Face Match Rate', value: 94.2, trend: 'up' },
    { metric: 'Average Check-in Time', value: 45, trend: 'down', unit: 'seconds' },
    { metric: 'Security Alerts', value: 3, trend: 'down' }
  ];

  useEffect(() => {
    // Mock data - in real app, fetch from backend based on timeRange
    setVisitorStats({
      totalVisitors: 201,
      averageVisitDuration: 135, // minutes
      peakHour: '14:00-15:00',
      repeatVisitors: 45,
      noShows: 8,
      securityIncidents: 3
    });
  }, [timeRange]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Visitor Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{visitorStats.totalVisitors}</p>
            <p className="text-sm text-muted-foreground">Total Visitors</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatDuration(visitorStats.averageVisitDuration)}</p>
            <p className="text-sm text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{visitorStats.peakHour}</p>
            <p className="text-sm text-muted-foreground">Peak Hour</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{visitorStats.repeatVisitors}</p>
            <p className="text-sm text-muted-foreground">Repeat Visitors</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{visitorStats.noShows}</p>
            <p className="text-sm text-muted-foreground">No Shows</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{visitorStats.securityIncidents}</p>
            <p className="text-sm text-muted-foreground">Security Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Daily Visitor Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyVisitors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                <Bar dataKey="denied" fill="#ef4444" name="Denied" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Hourly Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyTraffic}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Visit Purpose Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visitorPurpose}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitorPurpose.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Security Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(metric.trend)}
                    <div>
                      <p className="font-medium">{metric.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.trend === 'up' ? 'Improving' : 'Optimizing'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {metric.value}
                      {metric.unit === 'seconds' ? 's' : metric.unit || '%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Positive Trends</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mt-0.5" />
                  QR verification success rate increased by 2.3% this week
                </li>
                <li className="flex items-start gap-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mt-0.5" />
                  Average check-in time reduced to 45 seconds
                </li>
                <li className="flex items-start gap-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mt-0.5" />
                  45% of visitors are returning, indicating satisfaction
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-yellow-600">Areas for Improvement</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowDown className="h-4 w-4 text-yellow-500 mt-0.5" />
                  Consider staffing adjustments for 14:00-15:00 peak period
                </li>
                <li className="flex items-start gap-2">
                  <ArrowDown className="h-4 w-4 text-yellow-500 mt-0.5" />
                  8 no-shows this week - implement reminder system
                </li>
                <li className="flex items-start gap-2">
                  <ArrowDown className="h-4 w-4 text-yellow-500 mt-0.5" />
                  Review face recognition calibration for better accuracy
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};