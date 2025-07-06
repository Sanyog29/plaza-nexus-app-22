import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface OfflineAction {
  id: string;
  type: 'check_in' | 'check_out' | 'photo_capture' | 'emergency_alert';
  data: any;
  timestamp: string;
}

export function useOfflineCapability() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored - syncing offline actions');
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Working offline - actions will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load stored offline actions
    loadOfflineActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineActions = () => {
    const stored = localStorage.getItem('offlineActions');
    if (stored) {
      setOfflineActions(JSON.parse(stored));
    }
  };

  const storeOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...action
    };

    const updatedActions = [...offlineActions, newAction];
    setOfflineActions(updatedActions);
    localStorage.setItem('offlineActions', JSON.stringify(updatedActions));

    if (isOnline) {
      syncOfflineActions();
    }
  };

  const syncOfflineActions = async () => {
    if (offlineActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const actionsToSync = [...offlineActions];

    try {
      for (const action of actionsToSync) {
        await processOfflineAction(action);
      }

      // Clear synced actions
      setOfflineActions([]);
      localStorage.removeItem('offlineActions');
      
      if (actionsToSync.length > 0) {
        toast.success(`Synced ${actionsToSync.length} offline actions`);
      }
    } catch (error) {
      console.error('Error syncing offline actions:', error);
      toast.error('Failed to sync some offline actions');
    } finally {
      setIsSyncing(false);
    }
  };

  const processOfflineAction = async (action: OfflineAction) => {
    switch (action.type) {
      case 'check_in':
        await supabase
          .from('visitors')
          .update({
            status: 'checked_in',
            check_in_time: action.timestamp
          })
          .eq('id', action.data.visitorId);
        break;

      case 'check_out':
        await supabase
          .from('visitors')
          .update({
            status: 'checked_out',
            check_out_time: action.timestamp
          })
          .eq('id', action.data.visitorId);
        break;

      case 'photo_capture':
        // Photo data would be processed here
        console.log('Syncing photo capture:', action.data);
        break;

      case 'emergency_alert':
        await supabase.functions.invoke('send-email', {
          body: {
            to: action.data.emergencyContacts,
            subject: 'Emergency Alert',
            html: action.data.message
          }
        });
        break;
    }

    // Log the action
    await supabase.from('visitor_check_logs').insert({
      visitor_id: action.data.visitorId,
      action_type: action.type,
      performed_by: (await supabase.auth.getUser()).data.user?.id,
      notes: `Offline action synced at ${new Date().toISOString()}`,
      metadata: action.data
    });
  };

  return {
    isOnline,
    offlineActions: offlineActions.length,
    isSyncing,
    storeOfflineAction,
    syncOfflineActions
  };
}