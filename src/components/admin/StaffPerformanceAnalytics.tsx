import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Clock, Target, Award, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  assigned_role_title: string | null;
  department?: string;
}

interface PerformanceScore {
  id: string;
  user_id: string;
  metric_date: string;
  efficiency_score: number;
  quality_score: number;
  reliability_score: number;
  productivity_score: number;
  customer_satisfaction_score: number;
  total_tasks_completed: number;
  avg_response_time_hours: number;
  sla_compliance_rate: number;
  attendance_rate: number;
  user: {
    first_name: string;
    last_name: string;
    assigned_role_title: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours?: number;
  overtime_hours?: number;
  user: {
    first_name: string;
    last_name: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const StaffPerformanceAnalytics = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [performanceScores, setPerformanceScores] = useState<PerformanceScore[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffData();
  }, [selectedPeriod]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      
      // Fetch staff members
      const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, assigned_role_title, department')
        .not('assigned_role_title', 'is', null)
        .order('first_name', { ascending: true });

      if (staffError) throw staffError;
      setStaffMembers(staff || []);

      // Fetch performance scores for the selected period
      const startDate = subDays(new Date(), parseInt(selectedPeriod)).toISOString().split('T')[0];
      
      const { data: scores, error: scoresError } = await supabase
        .from('user_performance_scores')
        .select(`
          *,
          user:profiles!user_id(
            first_name, 
            last_name,
            assigned_role_title
          )
        `)
        .gte('metric_date', startDate)
        .order('metric_date', { ascending: false });

      if (scoresError) throw scoresError;
      setPerformanceScores(scores || []);

      // Fetch attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select(`
          *,
          user:profiles(first_name, last_name)
        `)
        .gte('check_in_time', startDate)
        .order('check_in_time', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendance || []);

    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate average scores
  const avgEfficiency = performanceScores.length > 0 
    ? performanceScores.reduce((sum, score) => sum + score.efficiency_score, 0) / performanceScores.length 
    : 0;

  const avgQuality = performanceScores.length > 0 
    ? performanceScores.reduce((sum, score) => sum + score.quality_score, 0) / performanceScores.length 
    : 0;

  const avgReliability = performanceScores.length > 0 
    ? performanceScores.reduce((sum, score) => sum + score.reliability_score, 0) / performanceScores.length 
    : 0;

  const avgSLACompliance = performanceScores.length > 0 
    ? performanceScores.reduce((sum, score) => sum + score.sla_compliance_rate, 0) / performanceScores.length 
    : 0;

  // Calculate total tasks completed
  const totalTasksCompleted = performanceScores.reduce((sum, score) => sum + score.total_tasks_completed, 0);

  // Calculate attendance rate
  const avgAttendanceRate = performanceScores.length > 0 
    ? performanceScores.reduce((sum, score) => sum + score.attendance_rate, 0) / performanceScores.length 
    : 0;

  // Prepare data for charts
  const performanceTrends = performanceScores
    .slice(0, 30)
    .reverse()
    .map(score => ({
      date: format(new Date(score.metric_date), 'MMM dd'),
      efficiency: score.efficiency_score,
      quality: score.quality_score,
      reliability: score.reliability_score,
      productivity: score.productivity_score
    }));

  const roleDistribution = staffMembers.reduce((acc, staff) => {
    const role = staff.assigned_role_title || 'unassigned';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleChartData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: role.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Performance Analytics</h2>
          <p className="text-muted-foreground">Monitor and analyze staff performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={fetchStaffData}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgEfficiency)}`}>
              {avgEfficiency.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Team performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgQuality)}`}>
              {avgQuality.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Work quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgSLACompliance)}`}>
              {avgSLACompliance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">On-time delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCompleted}</div>
            <p className="text-xs text-muted-foreground">Total tasks</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Team performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="quality" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="reliability" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Staff Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Distribution</CardTitle>
                <CardDescription>Team composition by role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Staff members with highest overall scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceScores
                  .filter((score, index, self) => 
                    index === self.findIndex(s => s.user_id === score.user_id)
                  )
                  .sort((a, b) => 
                    ((b.efficiency_score + b.quality_score + b.reliability_score + b.productivity_score) / 4) -
                    ((a.efficiency_score + a.quality_score + a.reliability_score + a.productivity_score) / 4)
                  )
                  .slice(0, 5)
                  .map((score) => {
                    const avgScore = (score.efficiency_score + score.quality_score + score.reliability_score + score.productivity_score) / 4;
                    return (
                      <div key={score.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {score.user.first_name} {score.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {score.user.assigned_role_title || 'Staff'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getScoreBadgeVariant(avgScore)}>
                            {avgScore.toFixed(1)}% Overall
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {score.total_tasks_completed} tasks completed
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="grid gap-4">
            {performanceScores
              .filter((score, index, self) => 
                index === self.findIndex(s => s.user_id === score.user_id)
              )
              .map((score) => (
                <Card key={score.user_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {score.user.first_name} {score.user.last_name}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {score.user.assigned_role_title || 'Staff'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {score.total_tasks_completed} tasks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                        <p className={`text-xl font-bold ${getScoreColor(score.efficiency_score)}`}>
                          {score.efficiency_score.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Quality</p>
                        <p className={`text-xl font-bold ${getScoreColor(score.quality_score)}`}>
                          {score.quality_score.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Reliability</p>
                        <p className={`text-xl font-bold ${getScoreColor(score.reliability_score)}`}>
                          {score.reliability_score.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">SLA Compliance</p>
                        <p className={`text-xl font-bold ${getScoreColor(score.sla_compliance_rate)}`}>
                          {score.sla_compliance_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Avg Response Time: {score.avg_response_time_hours.toFixed(1)} hours</span>
                        <span>Attendance Rate: {score.attendance_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4">
            {attendanceRecords.slice(0, 20).map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {record.user.first_name} {record.user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.check_in_time), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="font-medium">In:</span> {format(new Date(record.check_in_time), 'HH:mm')}
                        {record.check_out_time && (
                          <>
                            {" • "}
                            <span className="font-medium">Out:</span> {format(new Date(record.check_out_time), 'HH:mm')}
                          </>
                        )}
                      </p>
                      {record.total_hours && (
                        <p className="text-sm text-muted-foreground">
                          Total: {record.total_hours}h
                          {record.overtime_hours && record.overtime_hours > 0 && (
                            <span className="text-orange-600"> (+{record.overtime_hours}h OT)</span>
                          )}
                        </p>
                      )}
                      {!record.check_out_time && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {attendanceRecords.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Score Distribution</CardTitle>
                <CardDescription>Distribution of performance scores across team</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { score: '80-100%', count: performanceScores.filter(s => s.efficiency_score >= 80).length },
                    { score: '60-79%', count: performanceScores.filter(s => s.efficiency_score >= 60 && s.efficiency_score < 80).length },
                    { score: '40-59%', count: performanceScores.filter(s => s.efficiency_score >= 40 && s.efficiency_score < 60).length },
                    { score: '0-39%', count: performanceScores.filter(s => s.efficiency_score < 40).length }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="score" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Performance analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Strong Overall Performance</p>
                      <p className="text-sm text-muted-foreground">
                        Team average efficiency is {avgEfficiency.toFixed(1)}%, indicating good productivity levels.
                      </p>
                    </div>
                  </div>
                  
                  {avgSLACompliance < 85 && (
                    <div className="flex items-start gap-3 p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium">SLA Compliance Needs Attention</p>
                        <p className="text-sm text-muted-foreground">
                          Current SLA compliance is {avgSLACompliance.toFixed(1)}%. Consider reviewing workload distribution.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Team Composition</p>
                      <p className="text-sm text-muted-foreground">
                        {staffMembers.length} active staff members across different roles and departments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};