import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useOfflineSync = () => {
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load offline actions from localStorage with cleanup
  useEffect(() => {
    const stored = localStorage.getItem('offlineActions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Clean up stale actions (>7 days old) and failed actions
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const cleaned = parsed.filter((action: OfflineAction) => {
          if (action.timestamp < sevenDaysAgo) {
            console.log(`Removing stale action from useOfflineSync: ${action.id}`);
            return false;
          }
          if (action.retryCount >= 3) {
            console.log(`Removing failed action from useOfflineSync: ${action.id}`);
            return false;
          }
          return true;
        });
        setOfflineActions(cleaned);
        
        if (cleaned.length < parsed.length) {
          console.log(`Cleaned up ${parsed.length - cleaned.length} actions in useOfflineSync`);
        }
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
        localStorage.removeItem('offlineActions');
      }
    }
  }, []);

  // Save offline actions to localStorage
  useEffect(() => {
    localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
  }, [offlineActions]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineAction = useCallback((type: string, data: any) => {
    const action: OfflineAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    setOfflineActions(prev => [...prev, action]);
    return action.id;
  }, []);

  const removeOfflineAction = useCallback((id: string) => {
    setOfflineActions(prev => prev.filter(action => action.id !== id));
  }, []);

  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || offlineActions.length === 0 || isSyncing) return;

    setIsSyncing(true);

    const actionsToProcess = [...offlineActions];
    const processedActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        await processOfflineAction(action);
        processedActions.push(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        // Increment retry count and re-queue if under max retries
        if (action.retryCount < 3) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1
          });
        }
      }
    }

    // Remove successfully processed actions and update failed ones
    setOfflineActions(prev => [
      ...failedActions,
      ...prev.filter(action => 
        !processedActions.includes(action.id) && 
        !actionsToProcess.some(a => a.id === action.id)
      )
    ]);

    setIsSyncing(false);
  }, [isOnline, offlineActions, isSyncing]);

  const processOfflineAction = async (action: OfflineAction) => {
    switch (action.type) {
      case 'maintenance_request':
        await supabase
          .from('maintenance_requests')
          .insert(action.data);
        break;
      
      case 'utility_reading':
        await supabase
          .from('utility_readings')
          .insert(action.data);
        break;

      case 'checklist_update':
        await supabase
          .from('daily_checklists')
          .update(action.data.updates)
          .eq('id', action.data.id);
        break;

      case 'visitor_checkin':
        await supabase
          .from('visitor_check_logs')
          .insert(action.data);
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineActions.length > 0) {
      const timer = setTimeout(syncOfflineActions, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineActions.length, syncOfflineActions]);

  return {
    isOnline,
    isSyncing,
    offlineActions: offlineActions.length,
    addOfflineAction,
    removeOfflineAction,
    syncOfflineActions
  };
};