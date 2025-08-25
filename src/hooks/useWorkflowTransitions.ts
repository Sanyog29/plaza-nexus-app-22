import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowTransition {
  id: string;
  request_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  metadata: any;
  created_at: string;
}

export const useWorkflowTransitions = (requestId: string) => {
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;

    const fetchTransitions = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('request_workflow_transitions')
          .select(`
            *,
            changed_by_profile:changed_by(first_name, last_name)
          `)
          .eq('request_id', requestId)
          .order('changed_at', { ascending: true });

        if (error) throw error;
        setTransitions(data || []);
      } catch (error) {
        console.error('Error fetching workflow transitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransitions();

    // Set up real-time subscription for new transitions
    const channel = supabase
      .channel(`workflow_transitions_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_workflow_transitions',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          setTransitions(prev => [...prev, payload.new as WorkflowTransition]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return { transitions, isLoading };
};