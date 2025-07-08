import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BookOpen, Award, Clock, Target, TrendingUp, 
  PlayCircle, CheckCircle, AlertCircle, Users,
  Brain, Lightbulb, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'technical' | 'soft_skills' | 'compliance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  prerequisites: string[];
  skills: string[];
  isRequired: boolean;
  content: {
    lessons: number;
    videos: number;
    assessments: number;
    practicalExercises: number;
  };
}

interface StaffTrainingProgress {
  staffId: string;
  staffName: string;
  role: string;
  avatar_url?: string;
  overallProgress: number;
  completedModules: number;
  totalModules: number;
  certifications: Array<{
    name: string;
    earnedAt: string;
    expiresAt?: string;
    level: 'bronze' | 'silver' | 'gold';
  }>;
  currentModules: Array<{
    moduleId: string;
    moduleTitle: string;
    progress: number;
    startedAt: string;
    estimatedCompletion: string;
  }>;
  recommendedModules: string[];
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface TrainingAnalytics {
  totalStaff: number;
  activeTrainees: number;
  avgCompletionRate: number;
  certificationsIssued: number;
  upcomingDeadlines: Array<{
    staffName: string;
    moduleTitle: string;
    dueDate: string;
    priority: 'urgent' | 'high' | 'medium';
  }>;
  skillDistribution: Array<{
    skill: string;
    staffCount: number;
    avgLevel: number;
  }>;
}

export const StaffTrainingModule: React.FC = () => {
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [staffProgress, setStaffProgress] = useState<StaffTrainingProgress[]>([]);
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setIsLoading(true);
    try {
      // Fetch staff profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor', 'admin']);

      if (profilesError) throw profilesError;

      // Generate mock training data (in a real system, this would come from a training management system)
      const modules = generateTrainingModules();
      const progressData = generateStaffProgress(profiles || []);
      const analyticsData = generateAnalytics(progressData);

      setTrainingModules(modules);
      setStaffProgress(progressData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrainingModules = (): TrainingModule[] => {
    return [
      {
        id: '1',
        title: 'Workplace Safety Fundamentals',
        description: 'Essential safety protocols and procedures for maintenance work',
        category: 'safety',
        difficulty: 'beginner',
        duration: 45,
        prerequisites: [],
        skills: ['Safety Protocols', 'Risk Assessment'],
        isRequired: true,
        content: { lessons: 6, videos: 4, assessments: 2, practicalExercises: 3 },
      },
      {
        id: '2',
        title: 'Electrical Systems Maintenance',
        description: 'Advanced electrical maintenance and troubleshooting techniques',
        category: 'technical',
        difficulty: 'intermediate',
        duration: 90,
        prerequisites: ['Workplace Safety Fundamentals'],
        skills: ['Electrical Systems', 'Troubleshooting'],
        isRequired: false,
        content: { lessons: 8, videos: 6, assessments: 3, practicalExercises: 5 },
      },
      {
        id: '3',
        title: 'Customer Service Excellence',
        description: 'Effective communication and customer interaction skills',
        category: 'soft_skills',
        difficulty: 'beginner',
        duration: 30,
        prerequisites: [],
        skills: ['Communication', 'Customer Service'],
        isRequired: true,
        content: { lessons: 4, videos: 3, assessments: 1, practicalExercises: 2 },
      },
      {
        id: '4',
        title: 'HVAC Systems Management',
        description: 'Comprehensive HVAC maintenance and optimization',
        category: 'technical',
        difficulty: 'advanced',
        duration: 120,
        prerequisites: ['Electrical Systems Maintenance'],
        skills: ['HVAC', 'System Optimization'],
        isRequired: false,
        content: { lessons: 10, videos: 8, assessments: 4, practicalExercises: 6 },
      },
      {
        id: '5',
        title: 'Compliance and Documentation',
        description: 'Regulatory compliance and proper documentation practices',
        category: 'compliance',
        difficulty: 'intermediate',
        duration: 60,
        prerequisites: [],
        skills: ['Documentation', 'Compliance'],
        isRequired: true,
        content: { lessons: 5, videos: 3, assessments: 2, practicalExercises: 3 },
      },
      {
        id: '6',
        title: 'Leadership and Team Management',
        description: 'Essential leadership skills for supervisory roles',
        category: 'soft_skills',
        difficulty: 'advanced',
        duration: 75,
        prerequisites: ['Customer Service Excellence'],
        skills: ['Leadership', 'Team Management'],
        isRequired: false,
        content: { lessons: 7, videos: 5, assessments: 3, practicalExercises: 4 },
      },
      {
        id: '7',
        title: 'Data Management & Deletion Procedures',
        description: 'Learn proper procedures for managing and deleting maintenance requests, including when deletion is appropriate and data retention policies',
        category: 'compliance',
        difficulty: 'beginner',
        duration: 25,
        prerequisites: ['Compliance and Documentation'],
        skills: ['Data Management', 'Audit Trail', 'Compliance'],
        isRequired: true,
        content: { lessons: 4, videos: 2, assessments: 1, practicalExercises: 3 },
      },
    ];
  };

  const generateStaffProgress = (profiles: any[]): StaffTrainingProgress[] => {
    return profiles.map(profile => {
      const completedModules = Math.floor(Math.random() * 4) + 1;
      const totalModules = 7;
      const overallProgress = Math.round((completedModules / totalModules) * 100);

      return {
        staffId: profile.id,
        staffName: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown',
        role: profile.role,
        avatar_url: profile.avatar_url,
        overallProgress,
        completedModules,
        totalModules,
        certifications: generateCertifications(),
        currentModules: generateCurrentModules(),
        recommendedModules: ['2', '4'], // IDs of recommended modules
        skillGaps: generateSkillGaps(),
      };
    });
  };

  const generateCertifications = () => {
    const certs = [
      { name: 'Safety Certified', level: 'gold' as const },
      { name: 'Technical Specialist', level: 'silver' as const },
      { name: 'Customer Service Pro', level: 'bronze' as const },
    ];
    
    return certs.slice(0, Math.floor(Math.random() * 3) + 1).map(cert => ({
      ...cert,
      earnedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const generateCurrentModules = () => {
    return [
      {
        moduleId: '2',
        moduleTitle: 'Electrical Systems Maintenance',
        progress: Math.floor(Math.random() * 80) + 20,
        startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  const generateSkillGaps = () => {
    const skills = ['Electrical', 'HVAC', 'Plumbing', 'Documentation', 'Leadership'];
    return skills.slice(0, 3).map(skill => ({
      skill,
      currentLevel: Math.floor(Math.random() * 3) + 1,
      targetLevel: Math.floor(Math.random() * 2) + 4,
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
    }));
  };

  const generateAnalytics = (progressData: StaffTrainingProgress[]): TrainingAnalytics => {
    const totalStaff = progressData.length;
    const activeTrainees = progressData.filter(p => p.currentModules.length > 0).length;
    const avgCompletionRate = Math.round(
      progressData.reduce((acc, p) => acc + p.overallProgress, 0) / totalStaff
    );
    const certificationsIssued = progressData.reduce((acc, p) => acc + p.certifications.length, 0);

    return {
      totalStaff,
      activeTrainees,
      avgCompletionRate,
      certificationsIssued,
      upcomingDeadlines: [
        {
          staffName: 'John Doe',
          moduleTitle: 'Compliance and Documentation',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent',
        },
        {
          staffName: 'Jane Smith',
          moduleTitle: 'HVAC Systems Management',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
        },
      ],
      skillDistribution: [
        { skill: 'Safety Protocols', staffCount: 12, avgLevel: 4.2 },
        { skill: 'Electrical Systems', staffCount: 8, avgLevel: 3.1 },
        { skill: 'Customer Service', staffCount: 15, avgLevel: 3.8 },
        { skill: 'Documentation', staffCount: 6, avgLevel: 2.9 },
      ],
    };
  };

  const assignModuleToStaff = async (staffId: string, moduleId: string) => {
    // In a real system, this would create a training assignment
    toast.success('Training module assigned successfully');
    await fetchTrainingData(); // Refresh data
  };

  const selectedStaffData = selectedStaff ? staffProgress.find(s => s.staffId === selectedStaff) : null;

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
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Staff Training & Development
          </h2>
          <p className="text-muted-foreground">Adaptive learning system with skill gap analysis</p>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalStaff}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Trainees</p>
                  <p className="text-2xl font-bold text-white">{analytics.activeTrainees}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((analytics.activeTrainees / analytics.totalStaff) * 100)}% of staff
                  </p>
                </div>
                <PlayCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                  <p className="text-2xl font-bold text-white">{analytics.avgCompletionRate}%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-muted-foreground">+12% this month</span>
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
                  <p className="text-sm text-muted-foreground">Certifications</p>
                  <p className="text-2xl font-bold text-white">{analytics.certificationsIssued}</p>
                  <Badge className="mt-1 bg-purple-500/10 text-purple-400">
                    This Quarter
                  </Badge>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="progress">Staff Progress</TabsTrigger>
          <TabsTrigger value="analytics">Skills Analytics</TabsTrigger>
          <TabsTrigger value="assignments">Smart Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingModules.map((module) => (
              <Card key={module.id} className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium text-white mb-1">
                        {module.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            module.category === 'safety' ? 'text-red-400 border-red-400' :
                            module.category === 'technical' ? 'text-blue-400 border-blue-400' :
                            module.category === 'soft_skills' ? 'text-green-400 border-green-400' :
                            'text-yellow-400 border-yellow-400'
                          }`}
                        >
                          {module.category.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {module.difficulty}
                        </Badge>
                        {module.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{module.duration} minutes</span>
                    <span>{module.content.lessons} lessons</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" />
                      <span>{module.content.videos} videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{module.content.assessments} tests</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {module.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {module.prerequisites.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Prerequisites:</span>
                      <ul className="list-disc list-inside mt-1">
                        {module.prerequisites.map((prereq, index) => (
                          <li key={index}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staff List */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Staff Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {staffProgress.map((staff) => (
                  <div
                    key={staff.staffId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStaff === staff.staffId ? 'bg-primary/20' : 'bg-background/20 hover:bg-background/30'
                    }`}
                    onClick={() => setSelectedStaff(staff.staffId)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {staff.staffName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{staff.staffName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {staff.role.replace('_', ' ')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={staff.overallProgress} className="flex-1 h-1" />
                          <span className="text-xs text-white">{staff.overallProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Individual Progress Details */}
            {selectedStaffData && (
              <div className="md:col-span-2 space-y-4">
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">{selectedStaffData.staffName} - Training Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Modules</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedStaffData.completedModules}/{selectedStaffData.totalModules}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Progress</p>
                        <p className="text-2xl font-bold text-white">{selectedStaffData.overallProgress}%</p>
                      </div>
                    </div>

                    {/* Current Modules */}
                    {selectedStaffData.currentModules.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-white">Current Training</h4>
                        {selectedStaffData.currentModules.map((module, index) => (
                          <div key={index} className="p-3 bg-background/20 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-white text-sm">{module.moduleTitle}</span>
                              <span className="text-xs text-muted-foreground">{module.progress}%</span>
                            </div>
                            <Progress value={module.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Est. completion: {new Date(module.estimatedCompletion).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Certifications */}
                    {selectedStaffData.certifications.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-white">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedStaffData.certifications.map((cert, index) => (
                            <Badge 
                              key={index} 
                              className={`${
                                cert.level === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                                cert.level === 'silver' ? 'bg-gray-400/20 text-gray-300' :
                                'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {cert.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skill Gaps */}
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Identified Skill Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStaffData.skillGaps.map((gap, index) => (
                      <div key={index} className="p-3 bg-background/20 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{gap.skill}</span>
                          <Badge 
                            className={`${
                              gap.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              gap.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {gap.priority} priority
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="text-white">{gap.currentLevel}/5</span>
                          <span className="text-muted-foreground">Target:</span>
                          <span className="text-white">{gap.targetLevel}/5</span>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={(gap.currentLevel / gap.targetLevel) * 100} 
                            className="h-1" 
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Skill Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.skillDistribution.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{skill.skill}</span>
                        <div className="text-sm text-muted-foreground">
                          {skill.staffCount} staff • Avg: {skill.avgLevel}/5
                        </div>
                      </div>
                      <Progress value={(skill.avgLevel / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="p-3 bg-background/20 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-white text-sm">{deadline.staffName}</span>
                        <Badge 
                          className={`${
                            deadline.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            deadline.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {deadline.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{deadline.moduleTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Powered Training Recommendations
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Smart assignments based on skill gaps, role requirements, and performance data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffProgress.slice(0, 3).map((staff) => (
                <div key={staff.staffId} className="p-4 bg-background/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {staff.staffName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{staff.staffName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {staff.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Recommended
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {staff.recommendedModules.slice(0, 2).map((moduleId, index) => {
                      const module = trainingModules.find(m => m.id === moduleId);
                      if (!module) return null;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-primary/10 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{module.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {module.duration} min • {module.difficulty}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => assignModuleToStaff(staff.staffId, moduleId)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};