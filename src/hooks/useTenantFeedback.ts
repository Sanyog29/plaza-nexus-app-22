import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface TenantFeedback {
  id: string;
  tenant_id: string;
  request_id: string;
  rating: number;
  feedback_text?: string;
  response_time_rating?: number;
  quality_rating?: number;
  communication_rating?: number;
  created_at: string;
  request?: {
    title: string;
    status: string;
  };
}

export function useTenantFeedback() {
  const { user, isAdmin, isStaff } = useAuth();
  const [feedback, setFeedback] = useState<TenantFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('tenant_feedback')
        .select(`
          *,
          request:maintenance_requests(title, status)
        `)
        .order('created_at', { ascending: false });

      // If not staff/admin, only show user's own feedback
      if (!isStaff && !isAdmin) {
        query = query.eq('tenant_id', user!.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setFeedback(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, f) => sum + f.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
      
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createFeedback = async (feedbackData: {
    request_id: string;
    rating: number;
    feedback_text?: string;
    response_time_rating?: number;
    quality_rating?: number;
    communication_rating?: number;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tenant_feedback')
        .insert({
          ...feedbackData,
          tenant_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchFeedback();
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
      return null;
    }
  };

  const getFeedbackStats = () => {
    if (!feedback.length) return { averageRating: 0, totalFeedback: 0, ratingDistribution: [] };

    const ratingCounts = [0, 0, 0, 0, 0];
    feedback.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingCounts[f.rating - 1]++;
      }
    });

    return {
      averageRating,
      totalFeedback: feedback.length,
      ratingDistribution: ratingCounts.map((count, index) => ({
        rating: index + 1,
        count,
        percentage: Math.round((count / feedback.length) * 100)
      }))
    };
  };

  return {
    feedback,
    isLoading,
    averageRating,
    createFeedback,
    getFeedbackStats,
    refetch: fetchFeedback
  };
}