import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Clock, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';

interface VisitorActivity {
  id: string;
  visitor_name: string;
  action: string;
  timestamp: string;
  location?: string;
}

export const VisitorNotificationBanner: React.FC = () => {
  const [recentActivity, setRecentActivity] = useState<VisitorActivity[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    fetchRecentActivity();
    
    // Subscribe to visitor check logs for real-time updates
    const channel = supabase
      .channel('visitor-activity-banner')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_check_logs',
        },
        async (payload) => {
          // Get visitor details for the new check log
          const { data: visitor } = await supabase
            .from('visitors')
            .select('name, host_id')
            .eq('id', payload.new.visitor_id)
            .maybeSingle();

          if (visitor && visitor.host_id === user.id) {
            const newActivity: VisitorActivity = {
              id: payload.new.id,
              visitor_name: visitor.name,
              action: payload.new.action_type,
              timestamp: payload.new.timestamp,
              location: payload.new.location
            };
            
            setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      // Get recent visitor check logs for user's visitors
      const { data } = await supabase
        .from('visitor_check_logs')
        .select(`
          id,
          action_type,
          timestamp,
          location,
          visitors!visitor_check_logs_visitor_id_fkey (
            name,
            host_id
          )
        `)
        .eq('visitors.host_id', user.id)
        .gte('timestamp', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('timestamp', { ascending: false })
        .limit(5);

      if (data) {
        const activities: VisitorActivity[] = data.map(log => ({
          id: log.id,
          visitor_name: log.visitors?.name || 'Unknown Visitor',
          action: log.action_type,
          timestamp: log.timestamp,
          location: log.location
        }));
        
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching recent visitor activity:', error);
    }
  };

  const dismissActivity = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'check_in': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'check_out': return <User className="h-4 w-4 text-blue-500" />;
      case 'badge_assigned': return <User className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'check_in': return 'checked in';
      case 'check_out': return 'checked out';
      case 'badge_assigned': return 'was assigned a badge';
      case 'access_granted': return 'was granted access';
      default: return action.replace('_', ' ');
    }
  };

  const visibleActivities = recentActivity.filter(activity => !dismissedIds.has(activity.id));

  if (visibleActivities.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visibleActivities.map((activity) => (
        <Alert key={activity.id} className="bg-plaza-blue/10 border-plaza-blue/20">
          <div className="flex items-center gap-2">
            {getActionIcon(activity.action)}
            <AlertDescription className="flex-1">
              <strong>{activity.visitor_name}</strong> {getActionText(activity.action)}
              {activity.location && ` at ${activity.location}`}
              <span className="text-muted-foreground ml-2">
                {format(new Date(activity.timestamp), 'h:mm a')}
              </span>
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissActivity(activity.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};