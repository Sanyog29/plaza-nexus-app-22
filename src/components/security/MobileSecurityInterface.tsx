import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Wifi, WifiOff, Users, AlertTriangle, Camera, QrCode } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useOfflineCapability } from '@/hooks/useOfflineCapability';
import { useVoiceNotes } from '@/hooks/useVoiceNotes';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface MobileSecurityInterfaceProps {
  onTabChange: (tab: string) => void;
  stats: {
    expected: number;
    checkedIn: number;
    completed: number;
    pending: number;
  };
}

export const MobileSecurityInterface: React.FC<MobileSecurityInterfaceProps> = ({
  onTabChange,
  stats
}) => {
  const { isOnline, offlineActions, isSyncing, initialSyncDone, syncOfflineActions, clearAllActions } = useOfflineCapability();
  const { isRecording, hasRecording, startRecording, stopRecording, clearRecording } = useVoiceNotes();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'scanner',
      label: 'QR Scanner',
      icon: <QrCode className="h-6 w-6" />,
      color: 'bg-blue-600',
      action: () => onTabChange('scanner')
    },
    {
      id: 'checkin',
      label: 'Check-In',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-green-600',
      action: () => onTabChange('checkin')
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: <Camera className="h-6 w-6" />,
      color: 'bg-purple-600',
      action: () => onTabChange('camera')
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'bg-red-600',
      action: () => onTabChange('emergency')
    }
  ];

  const handleVoiceNote = () => {
    if (isRecording) {
      stopRecording();
    } else if (hasRecording) {
      clearRecording();
    } else {
      startRecording();
    }
  };

  const handleManualSync = () => {
    syncOfflineActions();
    toast.info('Manual sync triggered');
  };

  const handleClearQueue = () => {
    if (showClearConfirm) {
      clearAllActions();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      toast.warning('Tap again to confirm clearing all queued actions');
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {initialSyncDone && offlineActions > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {offlineActions} queued
                  </Badge>
                  {isOnline && (
                    <>
                      <Button
                        onClick={handleManualSync}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={isSyncing}
                      >
                        Sync
                      </Button>
                      <Button
                        onClick={handleClearQueue}
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 text-xs ${showClearConfirm ? 'text-red-400' : ''}`}
                      >
                        {showClearConfirm ? 'Confirm?' : 'Clear'}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {isSyncing && (
                <Badge className="bg-blue-600 text-xs">
                  Syncing...
                </Badge>
              )}
            </div>

            <Button
              onClick={handleVoiceNote}
              variant={isRecording ? "default" : "outline"}
              size="sm"
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'border-border'}`}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{stats.expected}</div>
            <div className="text-xs text-gray-400">Expected</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.checkedIn}</div>
            <div className="text-xs text-gray-400">Checked In</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-gray-400">{stats.completed}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-gray-400">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Large Touch Targets */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} hover:opacity-90 h-20 flex flex-col items-center gap-2 text-white`}
              >
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Recording Status */}
      {(isRecording || hasRecording) && (
        <Card className="bg-card/50 backdrop-blur border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className="text-sm text-white">
                  {isRecording ? 'Recording voice note...' : 'Voice note ready'}
                </span>
              </div>
              {hasRecording && !isRecording && (
                <Button
                  onClick={clearRecording}
                  variant="outline"
                  size="sm"
                  className="border-border text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};