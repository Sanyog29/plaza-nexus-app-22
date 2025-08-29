import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TaskUpdate {
  id: string;
  title: string;
  status: string;
  assigned_to?: string;
  completed_at?: string;
  priority: string;
}

export const TaskCompletionNotifier = () => {
  const [recentUpdates, setRecentUpdates] = useState<TaskUpdate[]>([]);

  useEffect(() => {
    // Set up real-time subscription for maintenance requests
    const channel = supabase
      .channel('task-completion-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maintenance_requests'
        },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;

          // Check if status changed to completed
          if (oldRecord?.status !== 'completed' && newRecord?.status === 'completed') {
            const update: TaskUpdate = {
              id: newRecord.id,
              title: newRecord.title,
              status: newRecord.status,
              assigned_to: newRecord.assigned_to,
              completed_at: newRecord.completed_at,
              priority: newRecord.priority
            };

            // Show toast notification
            toast({
              title: "Task Completed! ✅",
              description: `"${newRecord.title}" has been marked as completed (${newRecord.priority} priority)`,
              duration: 5000,
            });

            // Add to recent updates
            setRecentUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
          }

          // Check if status changed to in_progress
          if (oldRecord?.status !== 'in_progress' && newRecord?.status === 'in_progress') {
            toast({
              title: "Task Started 🚀",
              description: `"${newRecord.title}" is now in progress`,
              duration: 3000,
            });
          }

          // Check for urgent/high priority assignments
          if (oldRecord?.assigned_to !== newRecord?.assigned_to && 
              newRecord?.assigned_to && 
              ['urgent', 'high'].includes(newRecord?.priority)) {
            toast({
              title: "⚠️ Priority Task Assigned",
              description: `"${newRecord.title}" (${newRecord.priority} priority) has been assigned`,
              duration: 4000,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component only handles notifications, no UI
};

export default TaskCompletionNotifier;