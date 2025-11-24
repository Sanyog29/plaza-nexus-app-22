import { useEnhancedOfflineMode } from './useEnhancedOfflineMode';

export const useOfflineCapability = () => {
  // For backward compatibility, delegate to enhanced offline mode
  const enhanced = useEnhancedOfflineMode();
  
  return {
    isOnline: enhanced.isOnline,
    isSyncing: enhanced.isSyncing,
    initialSyncDone: enhanced.initialSyncDone,
    offlineActions: enhanced.offlineActions,
    addOfflineAction: (type: string, data: any) => enhanced.addOfflineAction(type as any, data, 'medium'),
    syncOfflineActions: enhanced.syncOfflineActions,
    clearAllActions: enhanced.clearAllActions
  };
};
