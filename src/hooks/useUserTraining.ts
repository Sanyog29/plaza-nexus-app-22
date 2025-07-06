import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'admin' | 'security';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  content: TrainingContent[];
  quiz?: Quiz;
  resources: TrainingResource[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrainingContent {
  id: string;
  type: 'text' | 'video' | 'interactive' | 'document';
  title: string;
  content: string;
  order: number;
  estimatedTime: number;
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
}

interface TrainingResource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
  description: string;
}

interface UserProgress {
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  quizScore?: number;
  timeSpent: number; // in minutes
  currentContent?: string;
}

interface TrainingAnalytics {
  totalUsers: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  moduleCompletion: Array<{
    moduleId: string;
    title: string;
    completionRate: number;
    averageScore: number;
  }>;
  userPerformance: Array<{
    userId: string;
    userName: string;
    completedModules: number;
    averageScore: number;
    totalTimeSpent: number;
  }>;
}

export const useUserTraining = () => {
  const { user } = useAuth();
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize default training modules
  const initializeTrainingModules = useCallback(() => {
    const defaultModules: TrainingModule[] = [
      {
        id: 'basic-navigation',
        title: 'System Navigation Basics',
        description: 'Learn how to navigate through the facility management system',
        category: 'basic',
        duration: 15,
        difficulty: 'beginner',
        prerequisites: [],
        isRequired: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          {
            id: 'nav-1',
            type: 'text',
            title: 'Dashboard Overview',
            content: 'The dashboard is your main hub for accessing all system features. Here you can view recent activities, notifications, and quick access buttons to key functions.',
            order: 1,
            estimatedTime: 3
          },
          {
            id: 'nav-2',
            type: 'interactive',
            title: 'Navigation Menu',
            content: 'The side navigation menu provides access to all major sections: Maintenance, Visitors, Services, and more. Click on each section to explore.',
            order: 2,
            estimatedTime: 5
          },
          {
            id: 'nav-3',
            type: 'text',
            title: 'User Profile & Settings',
            content: 'Access your profile and system settings from the top-right corner. Here you can update your information and preferences.',
            order: 3,
            estimatedTime: 2
          }
        ],
        quiz: {
          id: 'nav-quiz',
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              question: 'Where can you find the main navigation menu?',
              type: 'multiple_choice',
              options: ['Top bar', 'Side menu', 'Bottom bar', 'Center panel'],
              correctAnswer: 1,
              explanation: 'The main navigation menu is located in the side panel for easy access to all sections.'
            },
            {
              id: 'q2',
              question: 'The dashboard shows recent activities and notifications.',
              type: 'true_false',
              correctAnswer: 0,
              explanation: 'Yes, the dashboard is designed to show your most recent activities and important notifications.'
            }
          ]
        },
        resources: [
          {
            id: 'nav-guide',
            title: 'Navigation Quick Reference',
            type: 'pdf',
            url: '/guides/navigation-guide.pdf',
            description: 'Printable reference guide for system navigation'
          }
        ]
      },
      {
        id: 'maintenance-requests',
        title: 'Creating & Managing Maintenance Requests',
        description: 'Learn how to create, track, and manage maintenance requests effectively',
        category: 'basic',
        duration: 25,
        difficulty: 'beginner',
        prerequisites: ['basic-navigation'],
        isRequired: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          {
            id: 'maint-1',
            type: 'text',
            title: 'Understanding Maintenance Requests',
            content: 'Maintenance requests are used to report issues, schedule repairs, and track facility maintenance activities.',
            order: 1,
            estimatedTime: 5
          },
          {
            id: 'maint-2',
            type: 'interactive',
            title: 'Creating a New Request',
            content: 'Step-by-step process: Navigate to Maintenance → New Request → Fill required fields → Submit',
            order: 2,
            estimatedTime: 10
          },
          {
            id: 'maint-3',
            type: 'text',
            title: 'Request Tracking & Updates',
            content: 'Track your requests in the Maintenance section. You\'ll receive notifications for status updates.',
            order: 3,
            estimatedTime: 5
          }
        ],
        quiz: {
          id: 'maint-quiz',
          passingScore: 85,
          questions: [
            {
              id: 'mq1',
              question: 'What information is required when creating a maintenance request?',
              type: 'multiple_choice',
              options: ['Title and description only', 'Title, description, and location', 'Only the location', 'Only the priority level'],
              correctAnswer: 1,
              explanation: 'At minimum, you need to provide a title, description, and location for the maintenance issue.'
            }
          ]
        },
        resources: [
          {
            id: 'maint-video',
            title: 'Maintenance Request Walkthrough',
            type: 'video',
            url: '/videos/maintenance-walkthrough.mp4',
            description: 'Video demonstration of creating and managing maintenance requests'
          }
        ]
      },
      {
        id: 'visitor-management',
        title: 'Visitor Registration & Management',
        description: 'Learn the visitor check-in process and management procedures',
        category: 'basic',
        duration: 20,
        difficulty: 'beginner',
        prerequisites: ['basic-navigation'],
        isRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          {
            id: 'vis-1',
            type: 'text',
            title: 'Visitor Registration Process',
            content: 'All visitors must be registered before entering the facility. The system generates QR codes for easy check-in.',
            order: 1,
            estimatedTime: 5
          },
          {
            id: 'vis-2',
            type: 'interactive',
            title: 'Registering a New Visitor',
            content: 'Process: Security → Visitor Check-in → Enter details → Generate QR code → Print badge',
            order: 2,
            estimatedTime: 10
          }
        ],
        quiz: {
          id: 'vis-quiz',
          passingScore: 80,
          questions: [
            {
              id: 'vq1',
              question: 'All visitors must be registered before entering the facility.',
              type: 'true_false',
              correctAnswer: 0,
              explanation: 'Yes, registration is mandatory for security and tracking purposes.'
            }
          ]
        },
        resources: []
      },
      {
        id: 'admin-features',
        title: 'Administrative Features & Reporting',
        description: 'Advanced features for administrators including reports and user management',
        category: 'admin',
        duration: 45,
        difficulty: 'advanced',
        prerequisites: ['basic-navigation', 'maintenance-requests'],
        isRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          {
            id: 'admin-1',
            type: 'text',
            title: 'Admin Dashboard Overview',
            content: 'The admin dashboard provides comprehensive analytics, user management, and system configuration options.',
            order: 1,
            estimatedTime: 10
          },
          {
            id: 'admin-2',
            type: 'interactive',
            title: 'Generating Reports',
            content: 'Learn to create various reports: maintenance summaries, visitor logs, staff performance, and custom analytics.',
            order: 2,
            estimatedTime: 15
          },
          {
            id: 'admin-3',
            type: 'text',
            title: 'User Management',
            content: 'Manage user accounts, roles, and permissions. Add new users and modify existing access levels.',
            order: 3,
            estimatedTime: 10
          }
        ],
        quiz: {
          id: 'admin-quiz',
          passingScore: 90,
          questions: [
            {
              id: 'aq1',
              question: 'What types of reports can administrators generate?',
              type: 'multiple_choice',
              options: ['Only maintenance reports', 'Maintenance and visitor reports', 'All system reports including custom analytics', 'Only user activity reports'],
              correctAnswer: 2,
              explanation: 'Administrators have access to comprehensive reporting including maintenance, visitors, staff, and custom analytics.'
            }
          ]
        },
        resources: [
          {
            id: 'admin-manual',
            title: 'Administrator Manual',
            type: 'pdf',
            url: '/guides/admin-manual.pdf',
            description: 'Complete administrator guide with detailed procedures'
          }
        ]
      }
    ];

    setTrainingModules(defaultModules);
    return defaultModules;
  }, []);

  // Start training module
  const startTrainingModule = useCallback(async (moduleId: string) => {
    if (!user) return;

    try {
      const existingProgress = userProgress.find(p => p.moduleId === moduleId && p.userId === user.id);
      
      if (existingProgress && existingProgress.status === 'completed') {
        toast.info('You have already completed this module');
        return existingProgress;
      }

      const newProgress: UserProgress = {
        userId: user.id,
        moduleId,
        status: 'in_progress',
        progress: 0,
        startedAt: new Date().toISOString(),
        timeSpent: 0
      };

      setUserProgress(prev => prev.filter(p => !(p.moduleId === moduleId && p.userId === user.id)).concat(newProgress));
      toast.success('Training module started');
      
      return newProgress;
    } catch (error) {
      console.error('Error starting training module:', error);
      toast.error('Failed to start training module');
      throw error;
    }
  }, [user, userProgress]);

  // Update progress
  const updateProgress = useCallback(async (moduleId: string, contentId: string, timeSpent: number = 0) => {
    if (!user) return;

    try {
      const module = trainingModules.find(m => m.id === moduleId);
      if (!module) return;

      const contentIndex = module.content.findIndex(c => c.id === contentId);
      const progressPercentage = ((contentIndex + 1) / module.content.length) * 100;

      setUserProgress(prev => prev.map(p => 
        p.moduleId === moduleId && p.userId === user.id
          ? { 
              ...p, 
              progress: progressPercentage,
              currentContent: contentId,
              timeSpent: p.timeSpent + timeSpent
            }
          : p
      ));

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [user, trainingModules]);

  // Complete training module
  const completeTrainingModule = useCallback(async (moduleId: string, quizScore?: number) => {
    if (!user) return;

    try {
      const module = trainingModules.find(m => m.id === moduleId);
      if (!module) return;

      const requiredScore = module.quiz?.passingScore || 0;
      const passed = !module.quiz || (quizScore !== undefined && quizScore >= requiredScore);

      setUserProgress(prev => prev.map(p => 
        p.moduleId === moduleId && p.userId === user.id
          ? { 
              ...p, 
              status: passed ? 'completed' : 'failed',
              progress: 100,
              completedAt: new Date().toISOString(),
              quizScore
            }
          : p
      ));

      if (passed) {
        toast.success('Training module completed successfully!');
      } else {
        toast.error(`Training module failed. Minimum score required: ${requiredScore}%`);
      }

      await updateAnalytics();
      return passed;
    } catch (error) {
      console.error('Error completing training module:', error);
      toast.error('Failed to complete training module');
      throw error;
    }
  }, [user, trainingModules]);

  // Submit quiz
  const submitQuiz = useCallback(async (moduleId: string, answers: Record<string, any>) => {
    try {
      const module = trainingModules.find(m => m.id === moduleId);
      if (!module?.quiz) return null;

      let correctAnswers = 0;
      const totalQuestions = module.quiz.questions.length;

      module.quiz.questions.forEach(question => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      await completeTrainingModule(moduleId, score);
      
      return { score, passed: score >= module.quiz.passingScore };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      throw error;
    }
  }, [trainingModules, completeTrainingModule]);

  // Get user's training progress
  const getUserProgress = useCallback((userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    return userProgress.filter(p => p.userId === targetUserId);
  }, [user, userProgress]);

  // Get module completion status
  const getModuleStatus = useCallback((moduleId: string, userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return 'not_started';

    const progress = userProgress.find(p => p.moduleId === moduleId && p.userId === targetUserId);
    return progress?.status || 'not_started';
  }, [user, userProgress]);

  // Update analytics
  const updateAnalytics = useCallback(async () => {
    try {
      // Simulate multiple users for analytics
      const simulatedUsers = ['user1', 'user2', 'user3', user?.id].filter(Boolean);
      
      const completedProgress = userProgress.filter(p => p.status === 'completed');
      const totalProgress = userProgress.length;
      
      const completionRate = totalProgress > 0 ? (completedProgress.length / totalProgress) * 100 : 0;
      const averageScore = completedProgress.length > 0 
        ? completedProgress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / completedProgress.length
        : 0;
      const averageTimeSpent = completedProgress.length > 0
        ? completedProgress.reduce((sum, p) => sum + p.timeSpent, 0) / completedProgress.length
        : 0;

      const moduleCompletion = trainingModules.map(module => {
        const moduleProgress = userProgress.filter(p => p.moduleId === module.id);
        const moduleCompleted = moduleProgress.filter(p => p.status === 'completed');
        
        return {
          moduleId: module.id,
          title: module.title,
          completionRate: moduleProgress.length > 0 ? (moduleCompleted.length / moduleProgress.length) * 100 : 0,
          averageScore: moduleCompleted.length > 0 
            ? moduleCompleted.reduce((sum, p) => sum + (p.quizScore || 0), 0) / moduleCompleted.length
            : 0
        };
      });

      const analytics: TrainingAnalytics = {
        totalUsers: simulatedUsers.length,
        completionRate: Math.round(completionRate),
        averageScore: Math.round(averageScore),
        averageTimeSpent: Math.round(averageTimeSpent),
        moduleCompletion,
        userPerformance: simulatedUsers.map(userId => {
          const userProg = userProgress.filter(p => p.userId === userId);
          const completed = userProg.filter(p => p.status === 'completed');
          
          return {
            userId,
            userName: userId === user?.id ? 'You' : `User ${userId.slice(-1)}`,
            completedModules: completed.length,
            averageScore: completed.length > 0 
              ? Math.round(completed.reduce((sum, p) => sum + (p.quizScore || 0), 0) / completed.length)
              : 0,
            totalTimeSpent: Math.round(userProg.reduce((sum, p) => sum + p.timeSpent, 0))
          };
        })
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }, [userProgress, trainingModules, user]);

  // Export training report
  const exportTrainingReport = useCallback(() => {
    if (!analytics) return;

    const report = {
      generatedAt: new Date().toISOString(),
      analytics,
      modules: trainingModules.map(module => ({
        id: module.id,
        title: module.title,
        category: module.category,
        isRequired: module.isRequired
      })),
      userProgress: getUserProgress()
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training_report_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Training report exported successfully');
  }, [analytics, trainingModules, getUserProgress]);

  useEffect(() => {
    if (!user) return;

    const initializeTraining = async () => {
      try {
        setLoading(true);
        initializeTrainingModules();
        await updateAnalytics();
      } catch (error) {
        console.error('Error initializing training system:', error);
        setError('Failed to initialize training system');
      } finally {
        setLoading(false);
      }
    };

    initializeTraining();
  }, [user, initializeTrainingModules, updateAnalytics]);

  return {
    trainingModules,
    userProgress: getUserProgress(),
    analytics,
    loading,
    error,
    startTrainingModule,
    updateProgress,
    completeTrainingModule,
    submitQuiz,
    getModuleStatus,
    exportTrainingReport
  };
};