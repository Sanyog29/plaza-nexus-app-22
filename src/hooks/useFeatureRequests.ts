import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  votes: number;
  requested_by: string;
  assigned_to?: string | null;
  business_justification?: string | null;
  estimated_effort?: string | null;
  expected_completion?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[] | null;
  comments?: any;
  attachments?: any;
}

export const useFeatureRequests = () => {
  const { user } = useAuth();
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeatureRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database data to our interface
      const mappedData = (data || []).map(item => ({
        ...item,
        votes: item.votes || 0,
        tags: item.tags as string[] | null,
        comments: item.comments as any,
        attachments: item.attachments as any
      }));
      setFeatureRequests(mappedData);
    } catch (error: any) {
      console.error('Error fetching feature requests:', error);
      toast({
        title: "Error",
        description: "Failed to load feature requests: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createFeatureRequest = async (request: Omit<FeatureRequest, 'id' | 'created_at' | 'updated_at' | 'requested_by' | 'votes'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .insert([{
          ...request,
          requested_by: user.id,
          votes: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setFeatureRequests(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Feature request created successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating feature request:', error);
      toast({
        title: "Error",
        description: "Failed to create feature request: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFeatureRequest = async (id: string, updates: Partial<FeatureRequest>) => {
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFeatureRequests(prev => prev.map(req => 
        req.id === id ? { ...req, ...data } : req
      ));

      toast({
        title: "Success",
        description: "Feature request updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating feature request:', error);
      toast({
        title: "Error",
        description: "Failed to update feature request: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const voteForRequest = async (requestId: string) => {
    try {
      // For now, just increment the vote count
      // In a real implementation, you'd track individual votes
      const request = featureRequests.find(r => r.id === requestId);
      if (!request) return;

      const { error } = await supabase
        .from('feature_requests')
        .update({ votes: request.votes + 1 })
        .eq('id', requestId);

      if (error) throw error;

      setFeatureRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, votes: req.votes + 1 } : req
      ));

      toast({
        title: "Success",
        description: "Vote recorded successfully",
      });
    } catch (error: any) {
      console.error('Error voting for request:', error);
      toast({
        title: "Error",
        description: "Failed to record vote: " + error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeatureRequests();
    }
  }, [user]);

  return {
    featureRequests,
    isLoading,
    fetchFeatureRequests,
    createFeatureRequest,
    updateFeatureRequest,
    voteForRequest
  };
};