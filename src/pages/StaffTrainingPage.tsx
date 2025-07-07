import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  Play, 
  CheckCircle,
  Star,
  Users,
  Calendar,
  Target
} from 'lucide-react';

const StaffTrainingPage = () => {
  const [trainingModules] = useState([
    {
      id: 'safety-001',
      title: 'Workplace Safety Protocols',
      category: 'Safety',
      duration: '45 minutes',
      difficulty: 'Beginner',
      progress: 100,
      status: 'completed',
      rating: 4.8,
      description: 'Essential workplace safety procedures and emergency protocols.',
      completedDate: '2024-01-15'
    },
    {
      id: 'hvac-001',
      title: 'HVAC System Maintenance',
      category: 'Technical',
      duration: '2 hours',
      difficulty: 'Intermediate',
      progress: 65,
      status: 'in-progress',
      rating: 4.6,
      description: 'Comprehensive HVAC maintenance procedures and troubleshooting.',
      completedDate: null
    },
    {
      id: 'customer-001',
      title: 'Customer Service Excellence',
      category: 'Soft Skills',
      duration: '1 hour',
      difficulty: 'Beginner',
      progress: 0,
      status: 'not-started',
      rating: 4.7,
      description: 'Best practices for customer interaction and service delivery.',
      completedDate: null
    },
    {
      id: 'electrical-001',
      title: 'Electrical Safety & Basics',
      category: 'Technical',
      duration: '3 hours',
      difficulty: 'Advanced',
      progress: 0,
      status: 'locked',
      rating: 4.9,
      description: 'Advanced electrical safety procedures and basic electrical work.',
      completedDate: null
    }
  ]);

  const [certifications] = useState([
    {
      id: 'cert-001',
      title: 'HVAC Technician Level 1',
      issuer: 'HVAC Institute',
      status: 'active',
      validUntil: '2024-12-31',
      progress: 100,
      badge: 'HVAC-L1'
    },
    {
      id: 'cert-002',
      title: 'Electrical Safety Certification',
      issuer: 'Safety Board',
      status: 'active',
      validUntil: '2025-03-15',
      progress: 100,
      badge: 'ELEC-SAFE'
    },
    {
      id: 'cert-003',
      title: 'Advanced Facility Management',
      issuer: 'FM Academy',
      status: 'in-progress',
      validUntil: null,
      progress: 45,
      badge: 'FM-ADV'
    }
  ]);

  const [learningPath] = useState({
    currentLevel: 'Intermediate Technician',
    nextLevel: 'Senior Technician',
    overallProgress: 72,
    requiredModules: 8,
    completedModules: 6
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'not-started': return 'bg-gray-500';
      case 'locked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400';
      case 'Intermediate': return 'text-yellow-400';
      case 'Advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'in-progress': return 'text-blue-400';
      case 'expired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Training & Development
          </h1>
          <p className="text-muted-foreground">
            Enhance your skills and advance your career
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {learningPath.completedModules}/{learningPath.requiredModules} Modules Complete
        </Badge>
      </div>

      {/* Learning Path Progress */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Path Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-lg font-semibold text-white mb-2">Current Level</div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <div className="text-xl font-bold text-primary">{learningPath.currentLevel}</div>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white mb-2">Progress to Next Level</div>
              <div className="space-y-2">
                <Progress value={learningPath.overallProgress} className="h-3" />
                <div className="text-sm text-muted-foreground text-center">
                  {learningPath.overallProgress}% complete
                </div>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white mb-2">Next Level</div>
              <div className="p-4 bg-card/30 rounded-lg text-center">
                <div className="text-xl font-bold text-white">{learningPath.nextLevel}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Training Modules
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Progress
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <div className="grid gap-6">
            {trainingModules.map((module) => (
              <Card key={module.id} className="bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                        <Badge variant="outline" className="text-xs">{module.category}</Badge>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(module.status)} text-white text-xs`}
                        >
                          {module.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{module.duration}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getDifficultyColor(module.difficulty)}`}>
                          <Star className="h-4 w-4" />
                          <span>{module.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{module.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {module.status === 'completed' && (
                        <div className="text-sm text-green-400 mb-2">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Completed
                        </div>
                      )}
                      {module.status === 'locked' ? (
                        <Button disabled variant="outline" size="sm">
                          Locked
                        </Button>
                      ) : (
                        <Button variant="default" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          {module.status === 'completed' ? 'Review' : 
                           module.status === 'in-progress' ? 'Continue' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {module.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}
                  
                  {module.completedDate && (
                    <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Completed on {module.completedDate}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="grid gap-6">
            {certifications.map((cert) => (
              <Card key={cert.id} className="bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{cert.title}</h3>
                        <p className="text-sm text-muted-foreground">Issued by {cert.issuer}</p>
                        {cert.validUntil && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Valid until {cert.validUntil}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`mb-2 ${getCertStatusColor(cert.status)}`}
                      >
                        {cert.status}
                      </Badge>
                      <div className="text-sm font-mono text-muted-foreground">
                        {cert.badge}
                      </div>
                    </div>
                  </div>
                  
                  {cert.status === 'in-progress' && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Certification Progress</span>
                        <span>{cert.progress}%</span>
                      </div>
                      <Progress value={cert.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Learning Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">6</div>
                    <div className="text-sm text-muted-foreground">Modules Completed</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">12.5</div>
                    <div className="text-sm text-muted-foreground">Hours Learned</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">3</div>
                    <div className="text-sm text-muted-foreground">Certifications</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">4.7</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Skill Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>HVAC Systems</span>
                    <span className="text-green-400">Advanced</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Electrical Safety</span>
                    <span className="text-blue-400">Intermediate</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Customer Service</span>
                    <span className="text-yellow-400">Beginner</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Safety Protocols</span>
                    <span className="text-green-400">Expert</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Learning Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Equipment Manuals</div>
                  <div className="text-sm text-muted-foreground">Comprehensive equipment documentation</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Video Tutorials</div>
                  <div className="text-sm text-muted-foreground">Step-by-step procedural videos</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Safety Guidelines</div>
                  <div className="text-sm text-muted-foreground">Updated safety protocols and procedures</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Best Practices</div>
                  <div className="text-sm text-muted-foreground">Industry best practices and tips</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Support & Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Training Coordinator</div>
                  <div className="text-sm text-muted-foreground">Contact for training assistance</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Peer Mentorship</div>
                  <div className="text-sm text-muted-foreground">Connect with experienced colleagues</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Online Forums</div>
                  <div className="text-sm text-muted-foreground">Community discussions and Q&A</div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg">
                  <div className="font-medium text-white">Knowledge Base</div>
                  <div className="text-sm text-muted-foreground">Searchable articles and FAQs</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffTrainingPage;