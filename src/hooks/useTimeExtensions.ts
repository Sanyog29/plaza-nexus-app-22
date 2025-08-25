import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeExtension {
  id: string;
  request_id: string;
  requested_by: string;
  additional_hours: number;
  reason: string;
  notes?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  // Profile data
  requested_by_profile?: {
    first_name: string;
    last_name: string;
  };
  reviewed_by_profile?: {
    first_name: string;
    last_name: string;
  };
  // Additional fields for pending extensions
  maintenance_request?: {
    title: string;
    priority: string;
    status: string;
  };
}

interface RPCResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export const useTimeExtensions = (requestId?: string) => {
  const [extensions, setExtensions] = useState<TimeExtension[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch time extensions for a specific request
  const fetchExtensions = async () => {
    if (!requestId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('request_time_extensions')
        .select(`
          *,
          requested_by_profile:requested_by(first_name, last_name),
          reviewed_by_profile:reviewed_by(first_name, last_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExtensions((data as any) || []);
    } catch (error) {
      console.error('Error fetching time extensions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch time extensions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Request time extension
  const requestTimeExtension = async (
    requestId: string, 
    additionalHours: number, 
    reason: string, 
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('request_time_extension', {
        request_id: requestId,
        additional_hours: additionalHours,
        reason,
        notes
      });

      if (error) throw error;

      const result = data as RPCResponse;
      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: result?.message || "Time extension request submitted",
        variant: "default"
      });

      // Refresh extensions
      await fetchExtensions();
      return { success: true };
    } catch (error: any) {
      console.error('Error requesting time extension:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request time extension",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Review time extension (L2+ only)
  const reviewTimeExtension = async (
    extensionId: string,
    approved: boolean,
    reviewNotes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('review_time_extension', {
        extension_id: extensionId,
        approved,
        review_notes: reviewNotes
      });

      if (error) throw error;

      const result = data as RPCResponse;
      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: result?.message || "Time extension reviewed",
        variant: "default"
      });

      // Refresh extensions
      await fetchExtensions();
      return { success: true };
    } catch (error: any) {
      console.error('Error reviewing time extension:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to review time extension",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Assign and start request (L1) - Updated with better error handling
  const assignAndStartRequest = async (requestId: string) => {
    try {
      console.log('Calling assign_and_start_request for:', requestId);
      
      const { data, error } = await supabase.rpc('assign_and_start_request', {
        request_id: requestId
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('RPC response:', data);
      
      const result = data as RPCResponse;
      
      // Check for application-level errors
      if (result?.error) {
        throw new Error(result.error);
      }

      // Show success message
      toast({
        title: "Success",
        description: result?.message || "Request assigned and started successfully",
        variant: "default"
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error in assignAndStartRequest:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to assign and start request",
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    }
  };

  // Fetch all pending time extensions (for L2+ approval dashboard)
  const fetchPendingExtensions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('request_time_extensions')
        .select(`
          *,
          requested_by_profile:requested_by(first_name, last_name),
          maintenance_request:request_id(title, priority, status)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setExtensions((data as any) || []);
    } catch (error) {
      console.error('Error fetching pending extensions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending extensions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchExtensions();
    }
  }, [requestId]);

  return {
    extensions,
    isLoading,
    requestTimeExtension,
    reviewTimeExtension,
    assignAndStartRequest,
    fetchExtensions,
    fetchPendingExtensions,
  };
};
