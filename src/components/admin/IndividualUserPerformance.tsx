import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, TrendingUp, Clock, CheckCircle, Target, 
  Award, ArrowLeft, Calendar, Zap, Star
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface UserPerformance {
  user_id: string;
  name: string;
  role: string;
  avatar_url?: string;
  currentScore: {
    efficiency: number;
    quality: number;
    reliability: number;
    productivity: number;
    satisfaction: number;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    avgResponseTime: number;
    slaCompliance: number;
    attendanceRate: number;
  };
  trends: Array<{
    date: string;
    efficiency: number;
    quality: number;
    productivity: number;
  }>;
  skills: Array<{
    name: string;
    level: number;
    verified: boolean;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
    type: string;
  }>;
  recentRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    completed_at?: string;
  }>;
}

export const IndividualUserPerformance: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userPerformance, setUserPerformance] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (userId) {
      fetchUserPerformance(userId);
    }
  }, [userId, timeRange]);

  const fetchUserPerformance = async (targetUserId: string) => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Calculate current performance
      const { data: currentPerformance } = await supabase
        .rpc('calculate_user_performance_score', {
          target_user_id: targetUserId,
          score_date: new Date().toISOString().split('T')[0]
        });

      // Get historical performance trends
      const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const { data: trends } = await supabase
        .from('user_performance_scores')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('metric_date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      // Get user skills
      const { data: skills } = await supabase
        .from('staff_skills')
        .select('*')
        .eq('user_id', targetUserId)
        .order('proficiency_level', { ascending: false });

      // Get recent maintenance requests
      const { data: recentRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('assigned_to', targetUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Process data
      const perfData = currentPerformance as any;
      
      const performance: UserPerformance = {
        user_id: targetUserId,
        name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown',
        role: profile.role,
        avatar_url: profile.avatar_url,
        currentScore: {
          efficiency: Math.round(Number(perfData?.efficiency_score) || 85),
          quality: Math.round(Number(perfData?.quality_score) || 90),
          reliability: Math.round(Number(perfData?.reliability_score) || 95),
          productivity: Math.round(Number(perfData?.productivity_score) || 75),
          satisfaction: Math.round(Number(perfData?.customer_satisfaction_score) || 88),
        },
        metrics: {
          totalTasks: Number(perfData?.total_tasks_completed) || 0,
          completedTasks: Number(perfData?.total_tasks_completed) || 0,
          avgResponseTime: Number(perfData?.avg_response_time_hours) || 0,
          slaCompliance: Math.round(Number(perfData?.sla_compliance_rate) || 100),
          attendanceRate: Math.round(Number(perfData?.attendance_rate) || 0),
        },
        trends: (trends || []).map(trend => ({
          date: trend.metric_date,
          efficiency: Math.round(Number(trend.efficiency_score) || 85),
          quality: Math.round(Number(trend.quality_score) || 90),
          productivity: Math.round(Number(trend.productivity_score) || 75),
        })),
        skills: (skills || []).map(skill => ({
          name: skill.skill_name,
          level: skill.proficiency_level,
          verified: !!skill.verified_at,
        })),
        achievements: generateAchievements(perfData, skills || []),
        recentRequests: (recentRequests || []).map(req => ({
          id: req.id,
          title: req.title,
          status: req.status,
          priority: req.priority,
          created_at: req.created_at,
          completed_at: req.completed_at,
        })),
      };

      setUserPerformance(performance);
    } catch (error) {
      console.error('Error fetching user performance:', error);
      toast.error('Failed to load user performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAchievements = (perfData: any, skills: any[]) => {
    const achievements = [];
    
    if (Number(perfData?.efficiency_score) > 90) {
      achievements.push({
        title: 'Efficiency Expert',
        description: `Achieved ${Math.round(Number(perfData.efficiency_score))}% efficiency`,
        earnedAt: new Date().toISOString(),
        type: 'efficiency',
      });
    }
    
    if (Number(perfData?.quality_score) > 95) {
      achievements.push({
        title: 'Quality Champion',
        description: `Maintained ${Math.round(Number(perfData.quality_score))}% quality score`,
        earnedAt: new Date().toISOString(),
        type: 'quality',
      });
    }
    
    if (skills.length >= 5) {
      achievements.push({
        title: 'Multi-Skilled Professional',
        description: `Proficient in ${skills.length} skill areas`,
        earnedAt: new Date().toISOString(),
        type: 'skills',
      });
    }
    
    return achievements;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userPerformance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">User Not Found</h3>
            <p className="text-muted-foreground mb-4">Could not load user performance data.</p>
            <Button onClick={() => navigate('/admin/users')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const radarData = [
    { subject: 'Efficiency', score: userPerformance.currentScore.efficiency, fullMark: 100 },
    { subject: 'Quality', score: userPerformance.currentScore.quality, fullMark: 100 },
    { subject: 'Reliability', score: userPerformance.currentScore.reliability, fullMark: 100 },
    { subject: 'Productivity', score: userPerformance.currentScore.productivity, fullMark: 100 },
    { subject: 'Satisfaction', score: userPerformance.currentScore.satisfaction, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/admin/users')} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{userPerformance.name}</h1>
            <p className="text-muted-foreground capitalize">{userPerformance.role.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(userPerformance.currentScore.efficiency)}`}>
              {userPerformance.currentScore.efficiency}%
            </p>
            <p className="text-sm text-muted-foreground">Efficiency</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(userPerformance.currentScore.quality)}`}>
              {userPerformance.currentScore.quality}%
            </p>
            <p className="text-sm text-muted-foreground">Quality</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(userPerformance.currentScore.reliability)}`}>
              {userPerformance.currentScore.reliability}%
            </p>
            <p className="text-sm text-muted-foreground">Reliability</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(userPerformance.currentScore.productivity)}`}>
              {userPerformance.currentScore.productivity}%
            </p>
            <p className="text-sm text-muted-foreground">Productivity</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(userPerformance.currentScore.satisfaction)}`}>
              {userPerformance.currentScore.satisfaction}%
            </p>
            <p className="text-sm text-muted-foreground">Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="skills">Skills & Achievements</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Radar */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      domain={[0, 100]}
                    />
                    <Radar
                      name="Performance"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks Completed</span>
                  <span className="text-white font-medium">{userPerformance.metrics.completedTasks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="text-white font-medium">{userPerformance.metrics.avgResponseTime.toFixed(1)}h</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">SLA Compliance</span>
                    <span className={`font-medium ${getScoreColor(userPerformance.metrics.slaCompliance)}`}>
                      {userPerformance.metrics.slaCompliance}%
                    </span>
                  </div>
                  <Progress value={userPerformance.metrics.slaCompliance} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Attendance Rate</span>
                    <span className={`font-medium ${getScoreColor(userPerformance.metrics.attendanceRate)}`}>
                      {userPerformance.metrics.attendanceRate}%
                    </span>
                  </div>
                  <Progress value={userPerformance.metrics.attendanceRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={userPerformance.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                    name="Efficiency"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                    name="Quality"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B' }}
                    name="Productivity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Skills & Proficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userPerformance.skills.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        {skill.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        <span className="text-sm text-muted-foreground">Level {skill.level}/5</span>
                      </div>
                    </div>
                    <Progress value={skill.level * 20} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userPerformance.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Earned {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPerformance.recentRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-background/20 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{request.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        {request.completed_at && (
                          <p className="text-sm text-muted-foreground">
                            Completed {format(new Date(request.completed_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
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