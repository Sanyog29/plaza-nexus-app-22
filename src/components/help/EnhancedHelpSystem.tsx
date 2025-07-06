import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserTraining } from '@/hooks/useUserTraining';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Search, 
  GraduationCap, 
  FileText, 
  Video, 
  ExternalLink,
  Award,
  BarChart3,
  Download
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TrainingModuleCardProps {
  module: any;
  progress: any;
  onStart: (moduleId: string) => void;
  onResume: (moduleId: string) => void;
  onView: (moduleId: string) => void;
}

const TrainingModuleCard: React.FC<TrainingModuleCardProps> = ({ 
  module, 
  progress, 
  onStart, 
  onResume, 
  onView 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'failed': return 'Failed';
      default: return 'Not Started';
    }
  };

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
            <CardDescription className="text-sm">{module.description}</CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(progress?.status || 'not_started')} text-white ml-2`}
          >
            {getStatusText(progress?.status || 'not_started')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{module.duration} min</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {module.difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {module.category}
          </Badge>
          {module.isRequired && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </div>

        {progress && progress.status !== 'not_started' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            {progress.quizScore !== undefined && (
              <div className="text-sm text-muted-foreground">
                Quiz Score: {progress.quizScore}%
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {(!progress || progress.status === 'not_started') && (
            <Button onClick={() => onStart(module.id)} className="flex-1" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          
          {progress && progress.status === 'in_progress' && (
            <Button onClick={() => onResume(module.id)} className="flex-1" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
          
          {progress && progress.status === 'completed' && (
            <Button 
              onClick={() => onView(module.id)} 
              variant="outline" 
              className="flex-1" 
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Review
            </Button>
          )}
          
          {progress && progress.status === 'failed' && (
            <Button onClick={() => onStart(module.id)} className="flex-1" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Retake
            </Button>
          )}
          
          <Button 
            onClick={() => onView(module.id)} 
            variant="outline" 
            size="sm"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuizDialogProps {
  module: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => void;
}

const QuizDialog: React.FC<QuizDialogProps> = ({ module, isOpen, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    onSubmit(answers);
    setAnswers({});
    onClose();
  };

  if (!module?.quiz) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz: {module.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Passing Score: {module.quiz.passingScore}% | Questions: {module.quiz.questions.length}
          </div>
          
          {module.quiz.questions.map((question: any, index: number) => (
            <Card key={question.id}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <h4 className="font-medium">
                    {index + 1}. {question.question}
                  </h4>
                  
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={optionIndex}
                            checked={answers[question.id] === optionIndex}
                            onChange={(e) => setAnswers(prev => ({
                              ...prev,
                              [question.id]: parseInt(e.target.value)
                            }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true_false' && (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value="0"
                          checked={answers[question.id] === 0}
                          onChange={() => setAnswers(prev => ({
                            ...prev,
                            [question.id]: 0
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">True</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value="1"
                          checked={answers[question.id] === 1}
                          onChange={() => setAnswers(prev => ({
                            ...prev,
                            [question.id]: 1
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">False</span>
                      </label>
                    </div>
                  )}
                  
                  {question.type === 'text' && (
                    <Input
                      placeholder="Enter your answer..."
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < module.quiz.questions.length}
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EnhancedHelpSystem: React.FC = () => {
  const {
    trainingModules,
    userProgress,
    analytics,
    loading,
    startTrainingModule,
    submitQuiz,
    getModuleStatus,
    exportTrainingReport
  } = useUserTraining();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const filteredModules = trainingModules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartModule = async (moduleId: string) => {
    try {
      await startTrainingModule(moduleId);
      const module = trainingModules.find(m => m.id === moduleId);
      setSelectedModule(module);
    } catch (error) {
      console.error('Failed to start module:', error);
    }
  };

  const handleQuizSubmit = async (answers: Record<string, any>) => {
    if (!selectedModule) return;
    
    try {
      const result = await submitQuiz(selectedModule.id, answers);
      if (result?.passed) {
        toast.success(`Quiz passed! Score: ${result.score}%`);
      } else {
        toast.error(`Quiz failed. Score: ${result?.score}% (Required: ${selectedModule.quiz?.passingScore}%)`);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  const progressSummary = {
    total: trainingModules.length,
    completed: userProgress.filter(p => p.status === 'completed').length,
    inProgress: userProgress.filter(p => p.status === 'in_progress').length,
    required: trainingModules.filter(m => m.isRequired).length,
    requiredCompleted: userProgress.filter(p => 
      p.status === 'completed' && trainingModules.find(m => m.id === p.moduleId)?.isRequired
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading training modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training & Help Center</h1>
          <p className="text-muted-foreground mt-2">
            Learn how to use the system effectively with interactive training modules
          </p>
        </div>
        <Button onClick={exportTrainingReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="training" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Training Modules</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Training Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{progressSummary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{progressSummary.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{progressSummary.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {progressSummary.requiredCompleted}/{progressSummary.required}
                  </div>
                  <div className="text-sm text-muted-foreground">Required</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search training modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => {
              const progress = userProgress.find(p => p.moduleId === module.id);
              return (
                <TrainingModuleCard
                  key={module.id}
                  module={module}
                  progress={progress}
                  onStart={handleStartModule}
                  onResume={handleStartModule}
                  onView={(moduleId) => {
                    const module = trainingModules.find(m => m.id === moduleId);
                    setSelectedModule(module);
                  }}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span>Overall Completion</span>
                  <span className="font-medium">
                    {progressSummary.total > 0 
                      ? Math.round((progressSummary.completed / progressSummary.total) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={progressSummary.total > 0 
                    ? (progressSummary.completed / progressSummary.total) * 100 
                    : 0} 
                />

                <div className="space-y-4">
                  {userProgress.map(progress => {
                    const module = trainingModules.find(m => m.id === progress.moduleId);
                    if (!module) return null;

                    return (
                      <div key={progress.moduleId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{module.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Status: {progress.status}</span>
                            <span>Progress: {Math.round(progress.progress)}%</span>
                            {progress.quizScore && (
                              <span>Quiz: {progress.quizScore}%</span>
                            )}
                            <span>Time: {Math.round(progress.timeSpent)} min</span>
                          </div>
                        </div>
                        <Badge 
                          variant={progress.status === 'completed' ? 'default' : 
                                  progress.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {progress.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{analytics.averageScore}%</p>
                    </div>
                    <Award className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
                      <p className="text-2xl font-bold">{analytics.averageTimeSpent}m</p>
                    </div>
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                    </div>
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Training Module Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedModule && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedModule.title}</DialogTitle>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">{selectedModule.difficulty}</Badge>
                  <Badge variant="outline">{selectedModule.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.duration} minutes
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Content</h3>
                  {selectedModule.content.map((content: any, index: number) => (
                    <Card key={content.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{content.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{content.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {content.type === 'video' && <Video className="w-3 h-3" />}
                              {content.type === 'text' && <FileText className="w-3 h-3" />}
                              {content.type === 'interactive' && <ExternalLink className="w-3 h-3" />}
                              <span>{content.estimatedTime} min</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedModule.quiz && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Assessment</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Knowledge Quiz</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedModule.quiz.questions.length} questions • 
                              Passing score: {selectedModule.quiz.passingScore}%
                            </p>
                          </div>
                          <Button onClick={() => setShowQuiz(true)}>
                            Take Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedModule.resources.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedModule.resources.map((resource: any) => (
                        <Card key={resource.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {resource.type === 'pdf' && <FileText className="w-5 h-5" />}
                                {resource.type === 'video' && <Video className="w-5 h-5" />}
                                {resource.type === 'link' && <ExternalLink className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{resource.title}</h4>
                                <p className="text-sm text-muted-foreground">{resource.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <QuizDialog
        module={selectedModule}
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onSubmit={handleQuizSubmit}
      />
    </div>
  );
};