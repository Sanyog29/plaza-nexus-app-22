import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, ThumbsUp, ThumbsDown, Send, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RequestFeedbackSystemProps {
  requestId: string;
  requestTitle: string;
  completedAt?: string;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackData {
  id?: string;
  satisfaction_rating: number;
  response_time_rating?: number;
  quality_rating?: number;
  communication_rating?: number;
  feedback_text: string;
  would_recommend?: boolean;
  created_at?: string;
}

const RequestFeedbackSystem: React.FC<RequestFeedbackSystemProps> = ({
  requestId,
  requestTitle,
  completedAt,
  onFeedbackSubmitted
}) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackData>({
    satisfaction_rating: 0,
    response_time_rating: 0,
    quality_rating: 0,
    communication_rating: 0,
    feedback_text: '',
    would_recommend: undefined
  });
  const [existingFeedback, setExistingFeedback] = useState<FeedbackData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    checkExistingFeedback();
  }, [requestId, user]);

  const checkExistingFeedback = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_request_feedback')
        .select('*')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setExistingFeedback(data);
        setFeedback(data);
      }
    } catch (error: any) {
      console.error('Error checking existing feedback:', error);
    }
  };

  const handleStarRating = (rating: number, type: keyof FeedbackData) => {
    setFeedback(prev => ({
      ...prev,
      [type]: rating
    }));
  };

  const handleRecommendation = (recommend: boolean) => {
    setFeedback(prev => ({
      ...prev,
      would_recommend: recommend
    }));
  };

  const submitFeedback = async () => {
    if (!user || feedback.satisfaction_rating === 0) {
      toast({
        title: "Missing Rating",
        description: "Please provide at least an overall satisfaction rating",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        request_id: requestId,
        user_id: user.id,
        satisfaction_rating: feedback.satisfaction_rating,
        response_time_rating: feedback.response_time_rating || null,
        quality_rating: feedback.quality_rating || null,
        communication_rating: feedback.communication_rating || null,
        feedback_text: feedback.feedback_text || null,
        would_recommend: feedback.would_recommend
      };

      if (existingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('maintenance_request_feedback')
          .update(feedbackData)
          .eq('id', existingFeedback.id);

        if (error) throw error;

        toast({
          title: "Feedback Updated! 🎉",
          description: "Thank you for updating your feedback. It helps us improve our service."
        });
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('maintenance_request_feedback')
          .insert(feedbackData)
          .select()
          .single();

        if (error) throw error;

        setExistingFeedback(data);
        toast({
          title: "Feedback Submitted! 🎉",
          description: "Thank you for your feedback. It helps us improve our service."
        });
      }

      setShowFeedbackForm(false);
      onFeedbackSubmitted?.();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    rating: number,
    onChange: (rating: number) => void,
    label: string,
    disabled = false
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            disabled={disabled}
            className={cn(
              "p-1 rounded transition-colors",
              disabled ? "cursor-default" : "hover:bg-muted cursor-pointer"
            )}
          >
            <Star
              className={cn(
                "w-5 h-5",
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  // Don't show anything if not completed
  if (!completedAt) return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          Request Completed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Clock className="w-4 h-4" />
          <span>Completed on {new Date(completedAt).toLocaleDateString()}</span>
        </div>

        {existingFeedback ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-800">Your Feedback</h4>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Thank you! 
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Overall:</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= existingFeedback.satisfaction_rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {existingFeedback.would_recommend !== null && (
                <div>
                  <span className="text-muted-foreground">Recommend:</span>
                  <div className="flex items-center gap-1 mt-1">
                    {existingFeedback.would_recommend ? (
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {existingFeedback.would_recommend ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {existingFeedback.feedback_text && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground italic">
                  "{existingFeedback.feedback_text}"
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedbackForm(true)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Update Feedback
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">
                How was our service?
              </h4>
            </div>
            <p className="text-sm text-green-700">
              Your feedback helps us improve our maintenance services
            </p>
            <Button
              onClick={() => setShowFeedbackForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Star className="w-4 h-4 mr-2" />
              Rate & Review
            </Button>
          </div>
        )}

        {showFeedbackForm && (
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Feedback for: {requestTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Satisfaction - Required */}
              {renderStarRating(
                feedback.satisfaction_rating,
                (rating) => handleStarRating(rating, 'satisfaction_rating'),
                'Overall Satisfaction *'
              )}

              {/* Optional detailed ratings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderStarRating(
                  feedback.response_time_rating || 0,
                  (rating) => handleStarRating(rating, 'response_time_rating'),
                  'Response Time'
                )}

                {renderStarRating(
                  feedback.quality_rating || 0,
                  (rating) => handleStarRating(rating, 'quality_rating'),
                  'Work Quality'
                )}

                {renderStarRating(
                  feedback.communication_rating || 0,
                  (rating) => handleStarRating(rating, 'communication_rating'),
                  'Communication'
                )}
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Would you recommend our maintenance service?
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={feedback.would_recommend === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRecommendation(true)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={feedback.would_recommend === false ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleRecommendation(false)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    No
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="feedback-text" className="text-sm font-medium">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Tell us more about your experience..."
                  value={feedback.feedback_text}
                  onChange={(e) => setFeedback(prev => ({
                    ...prev,
                    feedback_text: e.target.value
                  }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={submitFeedback}
                  disabled={isSubmitting || feedback.satisfaction_rating === 0}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting 
                    ? 'Submitting...' 
                    : existingFeedback 
                      ? 'Update Feedback' 
                      : 'Submit Feedback'
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestFeedbackSystem;