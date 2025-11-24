import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useEnhancedOfflineMode } from '@/hooks/useEnhancedOfflineMode';
import { toast } from '@/components/ui/sonner';

export const OfflineActionsDebug: React.FC = () => {
  const { 
    isOnline, 
    isSyncing, 
    offlineActions, 
    pendingCriticalActions,
    syncOfflineActions, 
    clearAllActions,
    offlineCache 
  } = useEnhancedOfflineMode();

  const handleForceSync = () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    syncOfflineActions();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all queued offline actions? This cannot be undone.')) {
      clearAllActions();
    }
  };

  // Get raw actions from localStorage for inspection
  const rawActions = localStorage.getItem('offlineActions');
  let parsedActions: any[] = [];
  try {
    parsedActions = rawActions ? JSON.parse(rawActions) : [];
  } catch (e) {
    console.error('Failed to parse raw actions:', e);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Offline Actions Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Connection Status</div>
              <div className="text-lg font-semibold">
                {isOnline ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  <span className="text-red-500">Offline</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Sync Status</div>
              <div className="text-lg font-semibold">
                {isSyncing ? 'Syncing...' : 'Idle'}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Queued Actions</div>
              <div className="text-lg font-semibold">{offlineActions}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Critical Actions</div>
              <div className="text-lg font-semibold text-red-500">
                {pendingCriticalActions}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleForceSync}
              disabled={!isOnline || isSyncing || offlineActions === 0}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync Now
            </Button>
            <Button
              onClick={handleClearAll}
              variant="destructive"
              disabled={offlineActions === 0}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Queued Actions Details */}
          {parsedActions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Queued Actions Detail</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {parsedActions.map((action, index) => {
                  const ageInHours = Math.floor((Date.now() - action.timestamp) / (1000 * 60 * 60));
                  const isStale = ageInHours > 24;
                  
                  return (
                    <div 
                      key={action.id || index} 
                      className={`p-3 border rounded-lg ${isStale ? 'border-yellow-500 bg-yellow-500/10' : 'border-border'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{action.type}</span>
                            <Badge variant={
                              action.priority === 'critical' ? 'destructive' :
                              action.priority === 'high' ? 'default' : 'secondary'
                            }>
                              {action.priority}
                            </Badge>
                            {isStale && (
                              <Badge variant="outline" className="text-yellow-500">
                                {ageInHours}h old
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Retry: {action.retryCount}/{action.maxRetries}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(action.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cache Info */}
          <div className="space-y-2">
            <h3 className="font-semibold">Offline Cache</h3>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div>Emergency Contacts: {offlineCache.emergencyContacts.length}</div>
              <div>Critical Visitors: {offlineCache.criticalVisitors.length}</div>
              <div>Last Sync: {offlineCache.lastSync ? new Date(offlineCache.lastSync).toLocaleString() : 'Never'}</div>
            </div>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
            <p className="font-semibold mb-1">About Offline Actions:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Actions are automatically cleaned up after 7 days</li>
              <li>Failed actions are removed after max retries</li>
              <li>Critical actions have 10 retry attempts</li>
              <li>Sync happens automatically when connection is restored</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
