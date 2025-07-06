import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, TrendingUp, MessageSquare, Users, 
  ThumbsUp, ThumbsDown, BarChart3, Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SatisfactionMetrics {
  overallScore: number;
  totalResponses: number;
  responseRate: number;
  categoryScores: { [key: string]: number };
  trendData: { month: string; score: number }[];
  recentFeedback: FeedbackItem[];
}

interface FeedbackItem {
  id: string;
  requestId: string;
  requestTitle: string;
  rating: number;
  feedback: string;
  category: string;
  submittedAt: string;
  staffMember: string;
  respondedAt?: string;
  resolution?: string;
}

interface FeedbackForm {
  requestId: string;
  rating: number;
  feedback: string;
  category: string;
}

export const TenantSatisfactionScoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SatisfactionMetrics>({
    overallScore: 0,
    totalResponses: 0,
    responseRate: 0,
    categoryScores: {},
    trendData: [],
    recentFeedback: []
  });
  const [pendingFeedback, setPendingFeedback] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSatisfactionMetrics();
    loadPendingFeedback();
  }, []);

  const loadSatisfactionMetrics = async () => {
    try {
      // Mock satisfaction data - in real implementation, this would come from feedback table
      const mockMetrics: SatisfactionMetrics = {
        overallScore: 4.2,
        totalResponses: 284,
        responseRate: 73,
        categoryScores: {
          'Electrical': 4.5,
          'Plumbing': 4.1,
          'HVAC': 3.9,
          'General': 4.3,
          'Cleaning': 4.6
        },
        trendData: [
          { month: 'Jan', score: 3.8 },
          { month: 'Feb', score: 4.0 },
          { month: 'Mar', score: 4.1 },
          { month: 'Apr', score: 4.2 },
          { month: 'May', score: 4.2 },
          { month: 'Jun', score: 4.3 }
        ],
        recentFeedback: [
          {
            id: '1',
            requestId: 'req-1',
            requestTitle: 'Air conditioning repair in Conference Room A',
            rating: 5,
            feedback: 'Excellent service! The technician was professional and fixed the issue quickly.',
            category: 'HVAC',
            submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            staffMember: 'John Doe'
          },
          {
            id: '2',
            requestId: 'req-2',
            requestTitle: 'Leaking faucet in kitchen',
            rating: 3,
            feedback: 'Took longer than expected, but the issue was resolved.',
            category: 'Plumbing',
            submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            staffMember: 'Jane Smith'
          },
          {
            id: '3',
            requestId: 'req-3',
            requestTitle: 'Electrical outlet not working',
            rating: 4,
            feedback: 'Good service, friendly technician.',
            category: 'Electrical',
            submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            staffMember: 'Mike Johnson'
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading satisfaction metrics:', error);
    }
  };

  const loadPendingFeedback = async () => {
    try {
      // Get completed requests that haven't been rated yet
      const { data: completedRequests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          profiles!maintenance_requests_assigned_to_fkey(first_name, last_name),
          maintenance_categories(name)
        `)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (completedRequests) {
        // Filter out requests that already have feedback (mock filter)
        const pending = completedRequests.slice(0, 3).map(req => ({
          ...req,
          staffName: req.profiles ? `${req.profiles.first_name} ${req.profiles.last_name}` : 'Unknown',
          categoryName: req.maintenance_categories?.name || 'General'
        }));

        setPendingFeedback(pending);
      }
    } catch (error) {
      console.error('Error loading pending feedback:', error);
    }
  };

  const submitFeedback = async (formData: FeedbackForm) => {
    setIsSubmitting(true);
    try {
      // In real implementation, this would save to a feedback table
      const newFeedback: FeedbackItem = {
        id: Date.now().toString(),
        requestId: formData.requestId,
        requestTitle: pendingFeedback.find(r => r.id === formData.requestId)?.title || '',
        rating: formData.rating,
        feedback: formData.feedback,
        category: formData.category,
        submittedAt: new Date().toISOString(),
        staffMember: pendingFeedback.find(r => r.id === formData.requestId)?.staffName || ''
      };

      // Update metrics with new feedback
      setMetrics(prev => ({
        ...prev,
        recentFeedback: [newFeedback, ...prev.recentFeedback.slice(0, 9)],
        totalResponses: prev.totalResponses + 1
      }));

      // Remove from pending
      setPendingFeedback(prev => prev.filter(r => r.id !== formData.requestId));

      toast.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-400';
    if (score >= 4.0) return 'text-yellow-400';
    if (score >= 3.5) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            Tenant Satisfaction Scoring
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time feedback analysis and satisfaction tracking
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary">
          {metrics.responseRate}% Response Rate
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                    {metrics.overallScore}
                  </p>
                  {renderStars(Math.round(metrics.overallScore))}
                </div>
              </div>
              <Target className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold text-white">{metrics.totalResponses}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-white">{metrics.responseRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Feedback</p>
                <p className="text-2xl font-bold text-white">{pendingFeedback.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Scores */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.categoryScores).map(([category, score]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                      {score}
                    </span>
                    {renderStars(Math.round(score), 'sm')}
                  </div>
                </div>
                <Progress value={score * 20} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {metrics.recentFeedback.map((feedback) => (
              <div key={feedback.id} className="p-3 bg-background/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{feedback.requestTitle}</h4>
                    <p className="text-xs text-muted-foreground">
                      {feedback.staffMember} • {feedback.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(feedback.rating, 'sm')}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{feedback.feedback}</p>
                <div className="text-xs text-muted-foreground">
                  {new Date(feedback.submittedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Feedback Requests */}
      {pendingFeedback.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Feedback Requests ({pendingFeedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingFeedback.map((request) => (
              <Alert key={request.id} className="border-l-4 border-l-primary">
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{request.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>Completed by: {request.staffName}</span>
                        <Badge variant="outline" className="text-xs">
                          {request.categoryName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(request.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        // In a real app, this would open a feedback modal
                        submitFeedback({
                          requestId: request.id,
                          rating: 4,
                          feedback: 'Service completed satisfactorily',
                          category: request.categoryName
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      Rate Service
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Satisfaction Trends */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Satisfaction Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32">
            {metrics.trendData.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center">
                <div 
                  className="bg-primary/20 rounded-t mb-2 w-8"
                  style={{ height: `${(data.score / 5) * 80}px` }}
                />
                <span className="text-xs text-muted-foreground">{data.month}</span>
                <span className="text-xs text-white font-medium">{data.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};