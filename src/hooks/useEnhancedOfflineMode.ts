import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface OfflineAction {
  id: string;
  type: 'emergency_alert' | 'visitor_checkin' | 'maintenance_request' | 'security_incident' | 'incident_report';
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
}

interface OfflineCache {
  emergencyContacts: string[];
  criticalVisitors: any[];
  securityProtocols: any[];
  lastSync: number;
}

export const useEnhancedOfflineMode = () => {
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [offlineCache, setOfflineCache] = useState<OfflineCache>({
    emergencyContacts: [],
    criticalVisitors: [],
    securityProtocols: [],
    lastSync: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [criticalMode, setCriticalMode] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Clean up stale actions (older than 7 days)
  const cleanupStaleActions = useCallback((actions: OfflineAction[]) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const cleaned = actions.filter(action => {
      // Remove if older than 7 days
      if (action.timestamp < sevenDaysAgo) {
        console.log(`Removing stale action: ${action.id} (${action.type})`);
        return false;
      }
      // Remove if exceeded max retries
      if (action.retryCount >= action.maxRetries) {
        console.log(`Removing failed action: ${action.id} after ${action.retryCount} retries`);
        return false;
      }
      return true;
    });
    
    if (cleaned.length < actions.length) {
      const removed = actions.length - cleaned.length;
      console.log(`Cleaned up ${removed} stale/failed actions`);
      toast.info(`Removed ${removed} old queued actions`);
    }
    
    return cleaned;
  }, []);

  // Load offline data from localStorage with cleanup
  useEffect(() => {
    const storedActions = localStorage.getItem('offlineActions');
    const storedCache = localStorage.getItem('offlineCache');
    
    if (storedActions) {
      try {
        const parsed = JSON.parse(storedActions);
        const cleaned = cleanupStaleActions(parsed);
        setOfflineActions(cleaned);
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
        localStorage.removeItem('offlineActions');
      }
    }

    if (storedCache) {
      try {
        setOfflineCache(JSON.parse(storedCache));
      } catch (error) {
        console.error('Failed to parse offline cache:', error);
        localStorage.removeItem('offlineCache');
      }
    }
  }, [cleanupStaleActions]);

  // Save offline data to localStorage
  useEffect(() => {
    localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
  }, [offlineActions]);

  useEffect(() => {
    localStorage.setItem('offlineCache', JSON.stringify(offlineCache));
  }, [offlineCache]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setCriticalMode(false);
      toast.success('Connection restored - syncing offline data');
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Connection lost - entering offline mode');
      
      // Enable critical mode after 5 minutes offline
      const criticalTimer = setTimeout(() => {
        setCriticalMode(true);
        toast.error('Extended offline period - critical mode activated');
      }, 5 * 60 * 1000);

      return () => clearTimeout(criticalTimer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add action to offline queue with priority handling and validation
  const addOfflineAction = useCallback((
    type: OfflineAction['type'],
    data: any,
    priority: OfflineAction['priority'] = 'medium'
  ) => {
    // Validate data before queuing
    if (type === 'maintenance_request' && !data.property_id) {
      console.error('Cannot queue maintenance request without property_id');
      toast.error('Missing required property information');
      return null;
    }

    const action: OfflineAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: priority === 'critical' ? 10 : priority === 'high' ? 5 : 3
    };

    setOfflineActions(prev => {
      // Sort by priority (critical > high > medium > low) and timestamp
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const newActions = [...prev, action].sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
      return newActions;
    });

    // Show appropriate toast based on priority
    if (priority === 'critical') {
      toast.error(`Critical action queued for sync: ${type}`);
    } else if (priority === 'high') {
      toast.warning(`High priority action queued: ${type}`);
    } else {
      toast.info(`Action queued for sync: ${type}`);
    }

    return action.id;
  }, []);

  // Process offline emergency alert
  const processOfflineEmergencyAlert = useCallback(async (action: OfflineAction) => {
    const { type, details, timestamp, emergencyContacts } = action.data;
    
    // Send emergency alert
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emergencyContacts || offlineCache.emergencyContacts,
        subject: `🚨 DELAYED EMERGENCY ALERT: ${type}`,
        html: `
          <h2 style="color: #dc2626;">DELAYED EMERGENCY ALERT</h2>
          <p><strong>Alert Type:</strong> ${type}</p>
          <p><strong>Original Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p><strong>Sync Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Details:</strong> ${details}</p>
          <hr>
          <p><em>This alert was generated while the system was offline and is now being processed.</em></p>
        `
      }
    });

    if (error) throw error;

    // Log the delayed emergency alert
    await supabase.from('visitor_check_logs').insert({
      visitor_id: null,
      action_type: 'delayed_emergency_alert',
      performed_by: (await supabase.auth.getUser()).data.user?.id,
      notes: `Delayed emergency alert: ${type}`,
      metadata: {
        original_timestamp: timestamp,
        sync_timestamp: Date.now(),
        offline_duration_minutes: Math.floor((Date.now() - timestamp) / (1000 * 60)),
        ...action.data
      }
    });
  }, [offlineCache.emergencyContacts]);

  // Clear all offline actions manually
  const clearAllActions = useCallback(() => {
    setOfflineActions([]);
    localStorage.removeItem('offlineActions');
    toast.success('All queued actions cleared');
  }, []);

  // Sync offline actions with enhanced error handling
  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || offlineActions.length === 0 || isSyncing) {
      if (!initialSyncDone) setInitialSyncDone(true);
      return;
    }

    setIsSyncing(true);
    const actionsToProcess = [...offlineActions];
    const processedActionIds: string[] = [];
    const failedActions: OfflineAction[] = [];

    try {
      // Process critical actions first
      const sortedActions = actionsToProcess.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const action of sortedActions) {
        try {
          console.log(`Syncing action: ${action.type} (${action.id})`);
          
          switch (action.type) {
            case 'emergency_alert':
              await processOfflineEmergencyAlert(action);
              break;
              
            case 'visitor_checkin':
              const { error: checkinError } = await supabase.from('visitor_check_logs').insert(action.data);
              if (checkinError) throw checkinError;
              break;
              
            case 'maintenance_request':
              const { error: maintenanceError } = await supabase.from('maintenance_requests').insert(action.data);
              if (maintenanceError) throw maintenanceError;
              break;
              
            case 'security_incident':
              const { error: incidentError } = await supabase.from('visitor_check_logs').insert({
                ...action.data,
                action_type: 'security_incident',
                metadata: {
                  ...action.data.metadata,
                  offline_processed: true,
                  original_timestamp: action.timestamp
                }
              });
              if (incidentError) throw incidentError;
              break;
              
            case 'incident_report':
              const { error: reportError } = await supabase.from('visitor_check_logs').insert({
                ...action.data,
                action_type: 'incident_report',
                metadata: {
                  ...action.data.metadata,
                  offline_processed: true,
                  sync_delay_minutes: Math.floor((Date.now() - action.timestamp) / (1000 * 60))
                }
              });
              if (reportError) throw reportError;
              break;
          }

          processedActionIds.push(action.id);
          console.log(`Successfully synced action: ${action.id}`);
          
          // Show success toast for critical actions
          if (action.priority === 'critical') {
            toast.success(`Critical action synced: ${action.type}`);
          }
          
        } catch (error: any) {
          console.error(`Failed to sync action ${action.id}:`, error);
          console.error('Error details:', error.message, error.details, error.hint);
          
          // Increment retry count
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1
          };
          
          // Only retry if under max retries
          if (updatedAction.retryCount < updatedAction.maxRetries) {
            failedActions.push(updatedAction);
            console.log(`Will retry action ${action.id} (attempt ${updatedAction.retryCount}/${updatedAction.maxRetries})`);
          } else {
            console.error(`Action ${action.id} permanently failed after ${action.maxRetries} retries`);
            toast.error(`Failed to sync ${action.type}: ${error.message || 'Unknown error'}`);
          }
        }
      }

      // Update offline actions list
      setOfflineActions(prev => [
        ...failedActions,
        ...prev.filter(action => 
          !processedActionIds.includes(action.id) && 
          !actionsToProcess.some(a => a.id === action.id)
        )
      ]);

      if (processedActionIds.length > 0) {
        toast.success(`Synced ${processedActionIds.length} offline action${processedActionIds.length > 1 ? 's' : ''}`);
      } else if (failedActions.length > 0) {
        toast.warning(`${failedActions.length} action${failedActions.length > 1 ? 's' : ''} failed to sync`);
      }

    } catch (error) {
      console.error('Error during offline sync:', error);
      toast.error('Failed to sync some offline actions');
    } finally {
      setIsSyncing(false);
      setInitialSyncDone(true);
    }
  }, [isOnline, offlineActions, isSyncing, initialSyncDone, processOfflineEmergencyAlert]);

  // Cache critical data for offline use
  const cacheEmergencyData = useCallback(async () => {
    try {
      // Cache emergency contacts from profiles
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('*')
        .not('assigned_role_title', 'is', null);

      // Cache current VIP/critical visitors
      const { data: criticalVisitors } = await supabase
        .from('visitors')
        .select('*')
        .eq('status', 'checked_in');

      const emergencyContacts = ['admin@plaza.com', 'security@plaza.com'];

      setOfflineCache(prev => ({
        ...prev,
        emergencyContacts,
        criticalVisitors: criticalVisitors || [],
        lastSync: Date.now()
      }));

    } catch (error) {
      console.error('Error caching emergency data:', error);
    }
  }, []);

  // Initial sync on mount (if online)
  useEffect(() => {
    if (isOnline && !initialSyncDone) {
      const timer = setTimeout(() => {
        console.log('Performing initial sync on mount');
        syncOfflineActions();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, initialSyncDone, syncOfflineActions]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineActions.length > 0 && initialSyncDone) {
      const timer = setTimeout(syncOfflineActions, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineActions.length, initialSyncDone, syncOfflineActions]);

  // Periodically cache emergency data when online
  useEffect(() => {
    if (isOnline) {
      cacheEmergencyData();
      const interval = setInterval(cacheEmergencyData, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isOnline, cacheEmergencyData]);

  return {
    isOnline,
    isSyncing,
    criticalMode,
    initialSyncDone,
    offlineActions: offlineActions.length,
    pendingCriticalActions: offlineActions.filter(a => a.priority === 'critical').length,
    addOfflineAction,
    syncOfflineActions,
    clearAllActions,
    offlineCache
  };
};