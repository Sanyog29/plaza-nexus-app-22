import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, Users, Zap, Target, Clock, CheckCircle, 
  AlertTriangle, TrendingUp, Brain, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AITaskDistributionProps {
  onTaskAssigned?: (taskId: string, staffId: string) => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  currentLoad: number;
  availability: 'available' | 'busy' | 'offline';
  skills: string[];
  performance: {
    efficiency: number;
    quality: number;
    speed: number;
  };
  location: string;
  proximity: number; // Distance to task location
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  location: string;
  estimatedDuration: number;
  requiredSkills: string[];
  complexity: 'simple' | 'medium' | 'complex';
  aiRecommendations: {
    primaryChoice: string;
    alternativeChoices: string[];
    confidence: number;
    reasoning: string;
  };
}

interface DistributionSettings {
  prioritizeEfficiency: boolean;
  balanceWorkload: boolean;
  considerLocation: boolean;
  skillMatching: 'strict' | 'flexible' | 'adaptive';
  autoAssignThreshold: number;
}

export const AITaskDistribution: React.FC<AITaskDistributionProps> = ({ onTaskAssigned }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<DistributionSettings>({
    prioritizeEfficiency: true,
    balanceWorkload: true,
    considerLocation: true,
    skillMatching: 'adaptive',
    autoAssignThreshold: 85,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [distributionStats, setDistributionStats] = useState({
    tasksProcessed: 0,
    avgConfidence: 0,
    autoAssignments: 0,
    manualOverrides: 0,
  });

  useEffect(() => {
    fetchStaffAndTasks();
  }, []);

  const fetchStaffAndTasks = async () => {
    try {
      // Fetch staff data
      const { data: profiles, error: profilesError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor']);

      if (profilesError) throw profilesError;

      // Fetch pending tasks
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name)
        `)
        .eq('status', 'pending')
        .is('assigned_to', null);

      if (requestsError) throw requestsError;

      // Process staff data with AI insights
      const processedStaff = await processStaffData(profiles || []);
      const processedTasks = await processTasksWithAI(requests || [], processedStaff);

      setStaff(processedStaff);
      setTasks(processedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load staff and tasks data');
    }
  };

  const processStaffData = async (profiles: any[]): Promise<StaffMember[]> => {
    const processedStaff: StaffMember[] = [];

    for (const profile of profiles) {
      // Get current workload
      const { data: activeRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('assigned_to', profile.id)
        .in('status', ['pending', 'in_progress']);

      const currentLoad = Math.min((activeRequests?.length || 0) * 25, 100);

      // Get real skills from database
      const { data: userSkills } = await supabase
        .from('staff_skills')
        .select('skill_name, proficiency_level')
        .eq('user_id', profile.id);

      const skills = userSkills?.map(skill => skill.skill_name) || generateSkillsForRole(profile.role);
      
      // Get real performance metrics
      const performance = await calculateRealPerformanceMetrics(profile.id);

      // Check current availability based on attendance
      const { data: todayAttendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', profile.id)
        .gte('check_in_time', new Date().toISOString().split('T')[0])
        .is('check_out_time', null)
        .limit(1);

      const isOnShift = todayAttendance && todayAttendance.length > 0;
      const availability = !isOnShift ? 'offline' : currentLoad > 80 ? 'busy' : 'available';

      processedStaff.push({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown',
        role: profile.role,
        currentLoad,
        availability,
        skills,
        performance,
        location: profile.floor || 'Ground Floor',
        proximity: 0, // Will be calculated per task
      });
    }

    return processedStaff;
  };

  const generateSkillsForRole = (role: string): string[] => {
    const skillSets = {
      field_staff: ['General Maintenance', 'Electrical', 'Plumbing', 'HVAC'],
      ops_supervisor: ['Management', 'Quality Control', 'Training', 'Complex Repairs'],
    };
    return skillSets[role as keyof typeof skillSets] || ['General Maintenance'];
  };

  const calculateRealPerformanceMetrics = async (staffId: string) => {
    try {
      // Get the latest performance score
      const { data: latestScore } = await supabase
        .from('user_performance_scores')
        .select('*')
        .eq('user_id', staffId)
        .order('metric_date', { ascending: false })
        .limit(1);

      if (latestScore && latestScore.length > 0) {
        const score = latestScore[0];
        return {
          efficiency: Number(score.efficiency_score) || 85,
          quality: Number(score.quality_score) || 90,
          speed: Number(score.productivity_score) || 75,
        };
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }

    // Fallback to calculating based on recent requests
    const { data: completedRequests } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('assigned_to', staffId)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    const requestCount = completedRequests?.length || 0;
    
    // Calculate SLA compliance
    const slaCompliant = completedRequests?.filter(req => 
      !req.sla_breach_at || new Date(req.completed_at) <= new Date(req.sla_breach_at)
    ).length || 0;
    
    const slaRate = requestCount > 0 ? (slaCompliant / requestCount) * 100 : 100;
    
    // Calculate average completion time
    const avgCompletionHours = requestCount > 0 
      ? completedRequests.reduce((acc, req) => {
          const hours = (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }, 0) / requestCount
      : 24;
    
    return {
      efficiency: Math.min(100, Math.max(50, slaRate)),
      quality: Math.min(100, Math.max(60, 100 - (avgCompletionHours - 2) * 5)),
      speed: Math.min(100, Math.max(50, 80 + requestCount * 2)),
    };
  };

  const processTasksWithAI = async (requests: any[], staffMembers: StaffMember[]): Promise<Task[]> => {
    const processedTasks: Task[] = [];

    for (const request of requests) {
      const task: Task = {
        id: request.id,
        title: request.title,
        description: request.description,
        priority: request.priority,
        category: request.maintenance_categories?.name || 'General',
        location: request.location,
        estimatedDuration: estimateDuration(request.priority, request.description),
        requiredSkills: extractRequiredSkills(request.description, request.maintenance_categories?.name),
        complexity: determineComplexity(request.description, request.priority),
        aiRecommendations: await generateAIRecommendations(request, staffMembers, settings),
      };

      processedTasks.push(task);
    }

    return processedTasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const estimateDuration = (priority: string, description: string): number => {
    const baseDuration = priority === 'urgent' ? 2 : priority === 'high' ? 4 : priority === 'medium' ? 6 : 8;
    const complexityFactor = description.length > 100 ? 1.5 : 1;
    return Math.round(baseDuration * complexityFactor);
  };

  const extractRequiredSkills = (description: string, category?: string): string[] => {
    const skills = [];
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('electrical') || lowerDesc.includes('power') || lowerDesc.includes('lighting')) {
      skills.push('Electrical');
    }
    if (lowerDesc.includes('water') || lowerDesc.includes('plumbing') || lowerDesc.includes('pipe')) {
      skills.push('Plumbing');
    }
    if (lowerDesc.includes('hvac') || lowerDesc.includes('air') || lowerDesc.includes('heating')) {
      skills.push('HVAC');
    }
    if (category) {
      skills.push(category);
    }
    
    return skills.length > 0 ? skills : ['General Maintenance'];
  };

  const determineComplexity = (description: string, priority: string): 'simple' | 'medium' | 'complex' => {
    if (priority === 'urgent' || description.length > 150) return 'complex';
    if (priority === 'high' || description.length > 75) return 'medium';
    return 'simple';
  };

  const generateAIRecommendations = async (
    request: any, 
    staffMembers: StaffMember[], 
    settings: DistributionSettings
  ) => {
    // AI scoring algorithm
    const scores = staffMembers.map(staff => {
      let score = 0;
      let reasoning = [];

      // Availability check
      if (staff.availability === 'offline') return { staff, score: 0, reasoning: ['Staff is offline'] };
      
      // Workload balance
      if (settings.balanceWorkload) {
        const workloadScore = Math.max(0, 100 - staff.currentLoad);
        score += workloadScore * 0.3;
        reasoning.push(`Workload: ${100 - staff.currentLoad}% available capacity`);
      }

      // Skill matching
      const requiredSkills = extractRequiredSkills(request.description, request.maintenance_categories?.name);
      const skillMatch = requiredSkills.filter(skill => staff.skills.includes(skill)).length;
      const skillScore = (skillMatch / requiredSkills.length) * 100;
      
      if (settings.skillMatching === 'strict' && skillMatch < requiredSkills.length) {
        score = 0;
        reasoning = ['Missing required skills'];
      } else {
        const skillWeight = settings.skillMatching === 'adaptive' ? 0.4 : 0.3;
        score += skillScore * skillWeight;
        reasoning.push(`Skills: ${skillMatch}/${requiredSkills.length} match`);
      }

      // Performance factors
      if (settings.prioritizeEfficiency) {
        const avgPerformance = (staff.performance.efficiency + staff.performance.quality + staff.performance.speed) / 3;
        score += avgPerformance * 0.25;
        reasoning.push(`Performance: ${Math.round(avgPerformance)}% avg rating`);
      }

      // Location proximity (simplified)
      if (settings.considerLocation) {
        const locationScore = staff.location === request.location ? 100 : 70;
        score += locationScore * 0.15;
        reasoning.push(`Location: ${locationScore === 100 ? 'same floor' : 'different floor'}`);
      }

      return {
        staff,
        score: Math.round(score),
        reasoning: reasoning
      };
    }).filter(item => item.score > 0);

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    const primaryChoice = scores[0]?.staff.id || '';
    const alternativeChoices = scores.slice(1, 3).map(s => s.staff.id);
    const confidence = scores[0]?.score || 0;
    const reasoning = scores[0]?.reasoning.join('; ') || 'No suitable staff found';

    return {
      primaryChoice,
      alternativeChoices,
      confidence,
      reasoning,
    };
  };

  const handleAutoDistribute = async () => {
    setIsProcessing(true);
    try {
      let processed = 0;
      let autoAssigned = 0;
      let totalConfidence = 0;

      for (const task of tasks) {
        if (task.aiRecommendations.confidence >= settings.autoAssignThreshold) {
          await assignTask(task.id, task.aiRecommendations.primaryChoice);
          autoAssigned++;
        }
        processed++;
        totalConfidence += task.aiRecommendations.confidence;
      }

      setDistributionStats({
        tasksProcessed: processed,
        avgConfidence: Math.round(totalConfidence / processed),
        autoAssignments: autoAssigned,
        manualOverrides: 0,
      });

      toast.success(`Auto-distributed ${autoAssigned} out of ${processed} tasks`);
      await fetchStaffAndTasks(); // Refresh data
    } catch (error) {
      console.error('Error during auto-distribution:', error);
      toast.error('Failed to auto-distribute tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const assignTask = async (taskId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          assigned_to: staffId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      onTaskAssigned?.(taskId, staffId);
      return true;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const handleManualAssign = async (taskId: string, staffId: string) => {
    try {
      await assignTask(taskId, staffId);
      setDistributionStats(prev => ({
        ...prev,
        manualOverrides: prev.manualOverrides + 1,
      }));
      toast.success('Task assigned successfully');
      await fetchStaffAndTasks();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Task Distribution Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            Machine learning-powered optimal task assignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAutoDistribute}
            disabled={isProcessing || tasks.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Auto Distribute'}
          </Button>
        </div>
      </div>

      {/* Distribution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Processed</p>
                <p className="text-2xl font-bold text-white">{distributionStats.tasksProcessed}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold text-white">{distributionStats.avgConfidence}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto Assigned</p>
                <p className="text-2xl font-bold text-white">{distributionStats.autoAssignments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manual Overrides</p>
                <p className="text-2xl font-bold text-white">{distributionStats.manualOverrides}</p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks with AI Recommendations */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              AI Task Recommendations ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {tasks.map((task) => {
              const primaryStaff = staff.find(s => s.id === task.aiRecommendations.primaryChoice);
              return (
                <div key={task.id} className="p-4 bg-background/20 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{task.location}</p>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            task.priority === 'urgent' ? 'text-red-400 border-red-400' :
                            task.priority === 'high' ? 'text-orange-400 border-orange-400' :
                            task.priority === 'medium' ? 'text-yellow-400 border-yellow-400' :
                            'text-green-400 border-green-400'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.complexity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ~{task.estimatedDuration}h
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={`mb-2 ${
                          task.aiRecommendations.confidence >= 85 ? 'bg-green-500/20 text-green-400' :
                          task.aiRecommendations.confidence >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {task.aiRecommendations.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  {primaryStaff && (
                    <div className="bg-primary/10 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {primaryStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">
                            {primaryStaff.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Load: {primaryStaff.currentLoad}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={task.aiRecommendations.primaryChoice}
                            onValueChange={(staffId) => handleManualAssign(task.id, staffId)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.filter(s => s.availability !== 'offline').map((staffMember) => (
                                <SelectItem key={staffMember.id} value={staffMember.id}>
                                  {staffMember.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleManualAssign(task.id, task.aiRecommendations.primaryChoice)}
                            disabled={!primaryStaff}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI Reasoning: {task.aiRecommendations.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Required Skills */}
                  <div className="flex flex-wrap gap-1">
                    {task.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All tasks have been assigned!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Availability */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Availability & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {staff.map((staffMember) => (
              <div key={staffMember.id} className="p-3 bg-background/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white text-sm">{staffMember.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {staffMember.role.replace('_', ' ')} • {staffMember.location}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      staffMember.availability === 'available' ? 'bg-green-500/20 text-green-400' :
                      staffMember.availability === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {staffMember.availability}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Workload</span>
                    <span className="text-xs text-white">{staffMember.currentLoad}%</span>
                  </div>
                  <Progress value={staffMember.currentLoad} className="h-1" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Efficiency</p>
                    <p className="font-medium text-white">{staffMember.performance.efficiency}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Quality</p>
                    <p className="font-medium text-white">{staffMember.performance.quality}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Speed</p>
                    <p className="font-medium text-white">{staffMember.performance.speed}%</p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {staffMember.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};