import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSimplifiedTasks } from "@/hooks/useSimplifiedTasks";
import { 
  Users, 
  Brain, 
  Clock, 
  TrendingUp, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';

interface StaffSuggestion {
  staff_id: string;
  staff_name: string;
  workload_score: number;
  skill_match_percentage: number;
  availability_status: string;
}

interface TaskData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  estimated_hours: number;
}

const AdvancedTaskAssignment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createSimplifiedRequest, assignTask } = useSimplifiedTasks();
  const [suggestions, setSuggestions] = useState<StaffSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    estimated_hours: 1
  });
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('simple_task_categories')
        .select('*')
        .eq('is_active', true);
      
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const getSuggestions = async () => {
    if (!taskData.title || !taskData.category) {
      toast({
        title: "Missing Information",
        description: "Please provide task title and category",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('suggest_optimal_staff_assignment', {
        task_category: taskData.category,
        required_skills: [],
        priority: taskData.priority
      });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get staff suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (staffId: string) => {
    try {
      // First create a simplified request
      const request = await createSimplifiedRequest({
        description: `${taskData.title} - ${taskData.description}`,
        category: taskData.category,
        priority: taskData.priority,
        location: taskData.location
      });

      if (request) {
        // Then assign it to the selected staff
        const estimatedCompletion = new Date(Date.now() + taskData.estimated_hours * 60 * 60 * 1000).toISOString();
        await assignTask(request.id, staffId, `AI-suggested assignment based on workload analysis`, estimatedCompletion);

        toast({
          title: "Task Assigned",
          description: "Task has been successfully assigned to staff member",
        });

        // Reset form
        setTaskData({
          title: '',
          description: '',
          category: '',
          priority: 'medium',
          location: '',
          estimated_hours: 1
        });
        setSuggestions([]);
        setSelectedStaff('');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive"
      });
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Task Assignment</h1>
          <p className="text-muted-foreground">
            AI-powered task assignment with workload balancing and skill matching
          </p>
        </div>
        <Brain className="h-8 w-8 text-primary" />
      </div>

      <Tabs defaultValue="assignment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignment">Task Assignment</TabsTrigger>
          <TabsTrigger value="analytics">Assignment Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assignment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Task Details Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={taskData.title}
                    onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={taskData.description}
                    onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description and requirements"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={taskData.category} 
                      onValueChange={(value) => setTaskData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={taskData.priority} 
                      onValueChange={(value: any) => setTaskData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={taskData.location}
                    onChange={(e) => setTaskData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Task location"
                  />
                </div>

                <div>
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={taskData.estimated_hours}
                    onChange={(e) => setTaskData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) }))}
                  />
                </div>

                <Button 
                  onClick={getSuggestions} 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Get AI Suggestions'}
                </Button>
              </CardContent>
            </Card>

            {/* Staff Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Suggestions
                  {suggestions.length > 0 && (
                    <Badge variant="secondary">{suggestions.length} found</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Get AI Suggestions" to see optimal staff assignments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <div 
                        key={suggestion.staff_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStaff === suggestion.staff_id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedStaff(suggestion.staff_id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{suggestion.staff_name}</span>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">Best Match</Badge>
                              )}
                            </div>
                            <div 
                              className={`w-3 h-3 rounded-full ${getAvailabilityColor(suggestion.availability_status)}`}
                              title={`Status: ${suggestion.availability_status}`}
                            />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Score: {Math.round(suggestion.workload_score)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Skill Match:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress 
                                value={suggestion.skill_match_percentage} 
                                className="flex-1 h-2" 
                              />
                              <span className="text-xs font-medium">
                                {suggestion.skill_match_percentage}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Availability:</span>
                            <p className="capitalize font-medium">
                              {suggestion.availability_status}
                            </p>
                          </div>
                        </div>

                        {selectedStaff === suggestion.staff_id && (
                          <Button 
                            onClick={() => handleAssignTask(suggestion.staff_id)}
                            className="w-full mt-4"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Assign Task
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  Assignment Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">94.2%</div>
                <p className="text-sm text-muted-foreground">
                  AI-suggested assignments completed successfully
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Avg. Assignment Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">2.3 min</div>
                <p className="text-sm text-muted-foreground">
                  Time saved with automated suggestions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Workload Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">87%</div>
                <p className="text-sm text-muted-foreground">
                  Optimal workload distribution achieved
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignment Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Optimal Match Found</p>
                    <p className="text-sm text-muted-foreground">
                      HVAC maintenance task assigned to certified technician with 98% skill match
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Workload Balancing Applied</p>
                    <p className="text-sm text-muted-foreground">
                      Redistributed cleaning tasks to prevent overtime for John Smith
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Schedule Optimization</p>
                    <p className="text-sm text-muted-foreground">
                      Grouped related tasks to minimize travel time between locations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedTaskAssignment;