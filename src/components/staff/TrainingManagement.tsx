import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Users
} from 'lucide-react';

interface TrainingProgram {
  id: string;
  program_name: string;
  description: string;
  required_skills: string[];
  duration_hours: number;
  difficulty_level: number;
  is_mandatory: boolean;
  expiry_months?: number;
}

interface TrainingProgress {
  id: string;
  staff_id: string;
  program_id: string;
  status: string;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  score?: number;
  notes?: string;
  program_name: string;
  staff_name: string;
}

interface StaffSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number;
  verified_at?: string;
  verified_by?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

const TrainingManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [skills, setSkills] = useState<StaffSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('programs');

  // Form states
  const [newProgram, setNewProgram] = useState({
    program_name: '',
    description: '',
    duration_hours: 1,
    difficulty_level: 1,
    is_mandatory: false,
    expiry_months: undefined as number | undefined
  });

  const [skillUpdate, setSkillUpdate] = useState({
    skill_name: '',
    proficiency_level: 1
  });

  const [staffList, setStaffList] = useState<any[]>([]);

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['field_staff', 'ops_supervisor'])
        .eq('approval_status', 'approved');
      
      if (data) {
        setStaffList(data);
      }
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchProgress();
    fetchSkills();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_training_progress')
        .select(`
          *,
          training_programs(program_name),
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const progressWithNames = data?.map(item => ({
        ...item,
        program_name: item.training_programs?.program_name || '',
        staff_name: `${item.profiles?.first_name} ${item.profiles?.last_name}`
      })) || [];

      setProgress(progressWithNames);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_skills')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const createProgram = async () => {
    if (!newProgram.program_name || !newProgram.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('training_programs')
        .insert({
          program_name: newProgram.program_name,
          description: newProgram.description,
          duration_hours: newProgram.duration_hours,
          difficulty_level: newProgram.difficulty_level,
          is_mandatory: newProgram.is_mandatory,
          expiry_months: newProgram.expiry_months
        });

      if (error) throw error;

      toast({
        title: "Program Created",
        description: "Training program has been created successfully",
      });

      setNewProgram({
        program_name: '',
        description: '',
        duration_hours: 1,
        difficulty_level: 1,
        is_mandatory: false,
        expiry_months: undefined
      });

      fetchPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
      toast({
        title: "Error",
        description: "Failed to create training program",
        variant: "destructive"
      });
    }
  };

  const enrollInProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('staff_training_progress')
        .insert({
          staff_id: user?.id,
          program_id: programId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the training program",
      });

      fetchProgress();
    } catch (error) {
      console.error('Error enrolling in program:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in program",
        variant: "destructive"
      });
    }
  };

  const updateProgress = async (progressId: string, newPercentage: number) => {
    try {
      const updateData: any = {
        progress_percentage: newPercentage
      };

      if (newPercentage === 100) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('staff_training_progress')
        .update(updateData)
        .eq('id', progressId);

      if (error) throw error;

      toast({
        title: "Progress Updated",
        description: "Training progress has been updated",
      });

      fetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const addSkill = async () => {
    if (!skillUpdate.skill_name) {
      toast({
        title: "Missing Information",
        description: "Please enter a skill name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_skills')
        .insert({
          user_id: user?.id,
          skill_name: skillUpdate.skill_name,
          proficiency_level: skillUpdate.proficiency_level
        });

      if (error) throw error;

      toast({
        title: "Skill Added",
        description: "New skill has been added to your profile",
      });

      setSkillUpdate({
        skill_name: '',
        proficiency_level: 1
      });

      fetchSkills();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  const getProficiencyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Management</h1>
          <p className="text-muted-foreground">
            Manage training programs and track skill development
          </p>
        </div>
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="skills">My Skills</TabsTrigger>
          <TabsTrigger value="create">Create Program</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                    {program.is_mandatory && (
                      <Badge variant="destructive" className="text-xs">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {program.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{program.duration_hours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${getDifficultyColor(program.difficulty_level)}`}
                      />
                      <span>Level {program.difficulty_level}</span>
                    </div>
                  </div>

                  {program.required_skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {program.required_skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {program.required_skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{program.required_skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => enrollInProgram(program.id)}
                    className="w-full"
                    size="sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Enroll
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="space-y-4">
            {progress.filter(p => p.staff_id === user?.id).map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{item.program_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Started {item.started_at ? new Date(item.started_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(item.status)} className="capitalize">
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{item.progress_percentage}%</span>
                    </div>
                    <Progress value={item.progress_percentage} className="h-2" />
                  </div>

                  {item.status === 'in_progress' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => updateProgress(item.id, Math.min(100, item.progress_percentage + 25))}
                      >
                        +25% Progress
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => updateProgress(item.id, 100)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  )}

                  {item.completed_at && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed on {new Date(item.completed_at).toLocaleDateString()}</span>
                      {item.score && <span>• Score: {item.score}%</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {progress.filter(p => p.staff_id === user?.id).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No training programs enrolled yet</p>
                <p className="text-sm">Browse available programs to get started</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Skill</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skill_name">Skill Name</Label>
                  <Input
                    id="skill_name"
                    value={skillUpdate.skill_name}
                    onChange={(e) => setSkillUpdate(prev => ({ ...prev, skill_name: e.target.value }))}
                    placeholder="e.g., HVAC Maintenance, Electrical Work"
                  />
                </div>

                <div>
                  <Label htmlFor="proficiency">Proficiency Level</Label>
                  <Select 
                    value={skillUpdate.proficiency_level.toString()} 
                    onValueChange={(value) => setSkillUpdate(prev => ({ ...prev, proficiency_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Beginner</SelectItem>
                      <SelectItem value="2">2 - Basic</SelectItem>
                      <SelectItem value="3">3 - Intermediate</SelectItem>
                      <SelectItem value="4">4 - Advanced</SelectItem>
                      <SelectItem value="5">5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <Button onClick={addSkill} className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No skills recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{skill.skill_name}</span>
                            {skill.verified_at && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {getProficiencyStars(skill.proficiency_level)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Last used: {skill.last_used_at ? new Date(skill.last_used_at).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Training Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="program_name">Program Name</Label>
                <Input
                  id="program_name"
                  value={newProgram.program_name}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, program_name: e.target.value }))}
                  placeholder="Enter program name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProgram.description}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the training program"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (Hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={newProgram.duration_hours}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={newProgram.difficulty_level.toString()} 
                    onValueChange={(value) => setNewProgram(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Beginner</SelectItem>
                      <SelectItem value="2">2 - Basic</SelectItem>
                      <SelectItem value="3">3 - Intermediate</SelectItem>
                      <SelectItem value="4">4 - Advanced</SelectItem>
                      <SelectItem value="5">5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expiry">Certification Expiry (Months)</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="1"
                  value={newProgram.expiry_months || ''}
                  onChange={(e) => setNewProgram(prev => ({ 
                    ...prev, 
                    expiry_months: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={newProgram.is_mandatory}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, is_mandatory: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="mandatory">Mandatory Training</Label>
              </div>

              <Button onClick={createProgram} className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingManagement;