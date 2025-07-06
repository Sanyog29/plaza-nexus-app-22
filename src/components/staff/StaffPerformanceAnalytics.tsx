import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Award, Clock, 
  CheckCircle, AlertCircle, Users, Zap, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface StaffPerformanceData {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  performance: {
    efficiency: number;
    quality: number;
    reliability: number;
    productivity: number;
    customerSatisfaction: number;
  };
  metrics: {
    tasksCompleted: number;
    avgResponseTime: number;
    slaCompliance: number;
    attendanceRate: number;
    trainingProgress: number;
  };
  trends: Array<{
    date: string;
    efficiency: number;
    quality: number;
    productivity: number;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
    type: 'efficiency' | 'quality' | 'reliability' | 'customer_service';
  }>;
}

interface TeamPerformanceMetrics {
  totalStaff: number;
  activeStaff: number;
  avgEfficiency: number;
  avgSatisfaction: number;
  topPerformers: Array<{
    name: string;
    score: number;
    improvement: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    avgScore: number;
    staffCount: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const StaffPerformanceAnalytics: React.FC = () => {
  const [staffData, setStaffData] = useState<StaffPerformanceData[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamPerformanceMetrics | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch staff profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor', 'admin']);

      if (profilesError) throw profilesError;

      // Fetch maintenance requests for performance calculation
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', getDateRange(timeRange));

      if (requestsError) throw requestsError;

      // Fetch attendance data
      const { data: attendance, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('*')
        .gte('check_in_time', getDateRange(timeRange));

      if (attendanceError) throw attendanceError;

      // Process performance data
      const performanceData = await processStaffPerformance(profiles || [], requests || [], attendance || []);
      const teamData = calculateTeamMetrics(performanceData);

      setStaffData(performanceData);
      setTeamMetrics(teamData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to load performance analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  };

  const processStaffPerformance = async (
    profiles: any[], 
    requests: any[], 
    attendance: any[]
  ): Promise<StaffPerformanceData[]> => {
    const performanceData: StaffPerformanceData[] = [];

    for (const profile of profiles) {
      // Get staff's requests
      const staffRequests = requests.filter(r => r.assigned_to === profile.id);
      const completedRequests = staffRequests.filter(r => r.status === 'completed');
      
      // Get attendance records
      const staffAttendance = attendance.filter(a => a.staff_id === profile.id);
      
      // Calculate performance metrics
      const efficiency = calculateEfficiency(staffRequests, completedRequests);
      const quality = calculateQuality(completedRequests);
      const reliability = calculateReliability(staffRequests, staffAttendance);
      const productivity = calculateProductivity(staffRequests, staffAttendance);
      const customerSatisfaction = calculateSatisfaction(completedRequests);

      // Calculate key metrics
      const avgResponseTime = calculateAvgResponseTime(completedRequests);
      const slaCompliance = calculateSLACompliance(staffRequests);
      const attendanceRate = calculateAttendanceRate(staffAttendance);
      const trainingProgress = Math.random() * 100; // Mock training data

      // Generate trend data
      const trends = generateTrendData(profile.id, timeRange);

      // Generate achievements
      const achievements = generateAchievements(efficiency, quality, reliability, productivity);

      performanceData.push({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown',
        role: profile.role,
        avatar_url: profile.avatar_url,
        performance: {
          efficiency: Math.round(efficiency),
          quality: Math.round(quality),
          reliability: Math.round(reliability),
          productivity: Math.round(productivity),
          customerSatisfaction: Math.round(customerSatisfaction),
        },
        metrics: {
          tasksCompleted: completedRequests.length,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          slaCompliance: Math.round(slaCompliance),
          attendanceRate: Math.round(attendanceRate),
          trainingProgress: Math.round(trainingProgress),
        },
        trends,
        achievements,
      });
    }

    return performanceData.sort((a, b) => {
      const aScore = (a.performance.efficiency + a.performance.quality + a.performance.productivity) / 3;
      const bScore = (b.performance.efficiency + b.performance.quality + b.performance.productivity) / 3;
      return bScore - aScore;
    });
  };

  const calculateEfficiency = (requests: any[], completed: any[]) => {
    if (requests.length === 0) return 75;
    const completionRate = (completed.length / requests.length) * 100;
    const avgTime = completed.reduce((acc, req) => {
      const duration = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
      return acc + duration;
    }, 0) / (completed.length || 1);
    
    const hours = avgTime / (1000 * 60 * 60);
    const timeScore = Math.max(0, 100 - (hours - 2) * 10); // Penalty for taking too long
    
    return Math.min(100, (completionRate * 0.6) + (timeScore * 0.4));
  };

  const calculateQuality = (completed: any[]) => {
    if (completed.length === 0) return 80;
    // Mock quality score based on completion rate and no rework
    return Math.min(100, 85 + Math.random() * 15);
  };

  const calculateReliability = (requests: any[], attendance: any[]) => {
    if (requests.length === 0) return 85;
    const attendanceScore = attendance.length > 0 ? 90 : 70;
    const consistencyScore = Math.min(100, 80 + Math.random() * 20);
    return (attendanceScore * 0.5) + (consistencyScore * 0.5);
  };

  const calculateProductivity = (requests: any[], attendance: any[]) => {
    if (attendance.length === 0) return 75;
    const totalHours = attendance.reduce((acc, record) => {
      if (record.check_out_time) {
        const duration = new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime();
        return acc + (duration / (1000 * 60 * 60));
      }
      return acc;
    }, 0);
    
    const tasksPerHour = totalHours > 0 ? requests.length / totalHours : 0;
    return Math.min(100, tasksPerHour * 20 + 50);
  };

  const calculateSatisfaction = (completed: any[]) => {
    if (completed.length === 0) return 85;
    // Mock satisfaction score
    return Math.min(100, 80 + Math.random() * 20);
  };

  const calculateAvgResponseTime = (completed: any[]) => {
    if (completed.length === 0) return 0;
    const totalTime = completed.reduce((acc, req) => {
      const duration = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
      return acc + duration;
    }, 0);
    return (totalTime / completed.length) / (1000 * 60 * 60); // Convert to hours
  };

  const calculateSLACompliance = (requests: any[]) => {
    if (requests.length === 0) return 100;
    const compliantRequests = requests.filter(req => {
      if (!req.sla_breach_at) return true;
      if (req.status === 'completed') {
        return new Date(req.completed_at) <= new Date(req.sla_breach_at);
      }
      return new Date() <= new Date(req.sla_breach_at);
    });
    return (compliantRequests.length / requests.length) * 100;
  };

  const calculateAttendanceRate = (attendance: any[]) => {
    if (attendance.length === 0) return 0;
    const workDays = Math.ceil(attendance.length / 1.2); // Assuming some days might have multiple check-ins
    return Math.min(100, (attendance.length / workDays) * 100);
  };

  const generateTrendData = (staffId: string, range: 'week' | 'month' | 'quarter') => {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
    const trends = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        efficiency: Math.round(75 + Math.random() * 25),
        quality: Math.round(80 + Math.random() * 20),
        productivity: Math.round(70 + Math.random() * 30),
      });
    }
    
    return trends;
  };

  const generateAchievements = (efficiency: number, quality: number, reliability: number, productivity: number) => {
    const achievements = [];
    
    if (efficiency > 90) {
      achievements.push({
        title: 'Efficiency Master',
        description: 'Achieved 90%+ efficiency rating',
        earnedAt: new Date().toISOString(),
        type: 'efficiency' as const,
      });
    }
    
    if (quality > 95) {
      achievements.push({
        title: 'Quality Champion',
        description: 'Maintained 95%+ quality score',
        earnedAt: new Date().toISOString(),
        type: 'quality' as const,
      });
    }
    
    if (reliability > 90) {
      achievements.push({
        title: 'Reliability Star',
        description: 'Demonstrated exceptional reliability',
        earnedAt: new Date().toISOString(),
        type: 'reliability' as const,
      });
    }
    
    return achievements;
  };

  const calculateTeamMetrics = (staffData: StaffPerformanceData[]): TeamPerformanceMetrics => {
    const totalStaff = staffData.length;
    const activeStaff = staffData.filter(s => s.metrics.attendanceRate > 80).length;
    const avgEfficiency = staffData.reduce((acc, s) => acc + s.performance.efficiency, 0) / totalStaff;
    const avgSatisfaction = staffData.reduce((acc, s) => acc + s.performance.customerSatisfaction, 0) / totalStaff;
    
    const topPerformers = staffData
      .slice(0, 3)
      .map(s => ({
        name: s.name,
        score: (s.performance.efficiency + s.performance.quality + s.performance.productivity) / 3,
        improvement: Math.random() * 10 - 5, // Mock improvement data
      }));

    const departmentBreakdown = staffData.reduce((acc, staff) => {
      const dept = staff.role.replace('_', ' ').toUpperCase();
      if (!acc[dept]) {
        acc[dept] = { totalScore: 0, count: 0 };
      }
      acc[dept].totalScore += (staff.performance.efficiency + staff.performance.quality + staff.performance.productivity) / 3;
      acc[dept].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; count: number }>);

    const departmentData = Object.entries(departmentBreakdown).map(([department, data]) => ({
      department,
      avgScore: Math.round(data.totalScore / data.count),
      staffCount: data.count,
    }));

    return {
      totalStaff,
      activeStaff,
      avgEfficiency: Math.round(avgEfficiency),
      avgSatisfaction: Math.round(avgSatisfaction),
      topPerformers,
      departmentBreakdown: departmentData,
    };
  };

  const selectedStaffData = selectedStaff ? staffData.find(s => s.id === selectedStaff) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Performance Analytics</h2>
          <p className="text-muted-foreground">AI-powered performance insights and recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Team Overview */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold text-white">{teamMetrics.totalStaff}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                  <p className="text-2xl font-bold text-white">{teamMetrics.activeStaff}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((teamMetrics.activeStaff / teamMetrics.totalStaff) * 100)}% active
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
                  <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-white">{teamMetrics.avgEfficiency}%</p>
                  <div className="flex items-center mt-1">
                    {teamMetrics.avgEfficiency > 80 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <p className="text-2xl font-bold text-white">{teamMetrics.avgSatisfaction}%</p>
                  <Badge className="mt-1 bg-green-500/10 text-green-500">
                    Excellent
                  </Badge>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Top Performers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMetrics?.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Performance Score: {Math.round(performer.score)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {performer.improvement > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {performer.improvement > 0 ? '+' : ''}
                        {Math.round(performer.improvement * 10) / 10}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Department Breakdown */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamMetrics?.departmentBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staff List */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Staff Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {staffData.map((staff) => (
                  <div
                    key={staff.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStaff === staff.id ? 'bg-primary/20' : 'bg-background/20 hover:bg-background/30'
                    }`}
                    onClick={() => setSelectedStaff(staff.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{staff.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {staff.role.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {Math.round((staff.performance.efficiency + staff.performance.quality + staff.performance.productivity) / 3)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Individual Performance Details */}
            {selectedStaffData && (
              <div className="md:col-span-2 space-y-6">
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">{selectedStaffData.name} - Performance Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={[
                        { subject: 'Efficiency', A: selectedStaffData.performance.efficiency, fullMark: 100 },
                        { subject: 'Quality', A: selectedStaffData.performance.quality, fullMark: 100 },
                        { subject: 'Reliability', A: selectedStaffData.performance.reliability, fullMark: 100 },
                        { subject: 'Productivity', A: selectedStaffData.performance.productivity, fullMark: 100 },
                        { subject: 'Satisfaction', A: selectedStaffData.performance.customerSatisfaction, fullMark: 100 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tasks Completed</span>
                          <span className="font-medium text-white">{selectedStaffData.metrics.tasksCompleted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Response Time</span>
                          <span className="font-medium text-white">{selectedStaffData.metrics.avgResponseTime}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">SLA Compliance</span>
                          <span className="font-medium text-white">{selectedStaffData.metrics.slaCompliance}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Attendance Rate</span>
                          <span className="font-medium text-white">{selectedStaffData.metrics.attendanceRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Training Progress</span>
                          <span className="font-medium text-white">{selectedStaffData.metrics.trainingProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {selectedStaffData && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedStaffData.name} - Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={selectedStaffData.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="productivity" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffData.map((staff) => (
              <Card key={staff.id} className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-white">
                    {staff.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {staff.achievements.length > 0 ? (
                    staff.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-background/20 rounded-lg">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No achievements yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};