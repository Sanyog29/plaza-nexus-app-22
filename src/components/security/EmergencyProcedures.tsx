import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Phone, Users, Shield, FileText, Siren, Mic, MicOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedOfflineMode } from '@/hooks/useEnhancedOfflineMode';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { useCrossModuleIntegration } from '@/hooks/useCrossModuleIntegration';

export const EmergencyProcedures: React.FC = () => {
  const [emergencyType, setEmergencyType] = useState<string>('');
  const [emergencyDetails, setEmergencyDetails] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOnline, addOfflineAction, criticalMode, pendingCriticalActions } = useEnhancedOfflineMode();
  const { processVisitorEvent } = useCrossModuleIntegration();
  
  // Voice-to-text integration
  const {
    isListening,
    transcript,
    finalTranscript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceToText({
    continuous: true,
    interimResults: true
  });

  const emergencyTypes = [
    { value: 'fire', label: 'Fire Emergency', icon: '🔥', color: 'bg-red-600' },
    { value: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'bg-blue-600' },
    { value: 'security', label: 'Security Threat', icon: '🚨', color: 'bg-orange-600' },
    { value: 'evacuation', label: 'Building Evacuation', icon: '🚪', color: 'bg-purple-600' },
    { value: 'lockdown', label: 'Lockdown Protocol', icon: '🔒', color: 'bg-gray-600' },
    { value: 'other', label: 'Other Emergency', icon: '⚠️', color: 'bg-yellow-600' }
  ];

  const handleEmergencyAlert = async () => {
    if (!emergencyType || !emergencyDetails.trim()) {
      toast.error('Please select emergency type and provide details');
      return;
    }

    setIsProcessing(true);
    try {
      const emergencyData = {
        type: emergencyType,
        details: emergencyDetails,
        timestamp: new Date().toISOString(),
        reportedBy: (await supabase.auth.getUser()).data.user?.id
      };

      if (isOnline) {
        // Send immediate alert
        await supabase.functions.invoke('send-email', {
          body: {
            to: ['admin@plaza.com', 'security@plaza.com'], // Replace with actual emergency contacts
            subject: `🚨 EMERGENCY ALERT: ${emergencyTypes.find(t => t.value === emergencyType)?.label}`,
            html: `
              <h2 style="color: #dc2626;">EMERGENCY ALERT</h2>
              <p><strong>Type:</strong> ${emergencyTypes.find(t => t.value === emergencyType)?.label}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Details:</strong></p>
              <p>${emergencyDetails}</p>
              <hr>
              <p><em>This is an automated emergency alert from the Plaza Security System.</em></p>
            `
          }
        });

        // Log emergency in database
        await supabase.from('visitor_check_logs').insert({
          visitor_id: null,
          action_type: 'emergency_alert',
          performed_by: emergencyData.reportedBy,
          notes: `Emergency Alert: ${emergencyType}`,
          metadata: emergencyData
        });

        toast.success('Emergency alert sent to all contacts');
      } else {
        // Store for offline sync with critical priority
        addOfflineAction('emergency_alert', {
          ...emergencyData,
          emergencyContacts: ['admin@plaza.com', 'security@plaza.com']
        }, 'critical');
        toast.warning('Emergency alert queued - will send when online');
      }

      // Trigger cross-module integration for emergency response
      if (emergencyType === 'fire' || emergencyType === 'evacuation') {
        await processVisitorEvent('emergency', 'facility_emergency', {
          type: emergencyType,
          details: emergencyDetails,
          facilityDamage: true,
          location: 'Building Wide'
        });
      }

      setEmergencyType('');
      setEmergencyDetails('');
      resetTranscript();

    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEvacuationProcedure = async () => {
    setIsProcessing(true);
    try {
      // Get all checked-in visitors for evacuation list
      const { data: checkedInVisitors } = await supabase
        .from('visitors')
        .select('id, name, company, host_id, profiles!visitors_host_id_fkey(first_name, last_name)')
        .eq('status', 'checked_in');

      if (checkedInVisitors && checkedInVisitors.length > 0) {
        const evacuationList = checkedInVisitors.map(v => 
          `${v.name} (${v.company || 'No Company'}) - Host: Unknown`
        ).join('\n');

        await supabase.functions.invoke('send-email', {
          body: {
            to: ['admin@plaza.com', 'security@plaza.com'],
            subject: '🚨 EVACUATION PROCEDURE - Current Visitor List',
            html: `
              <h2 style="color: #dc2626;">EVACUATION PROCEDURE INITIATED</h2>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Currently Checked-In Visitors (${checkedInVisitors.length}):</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${evacuationList}</pre>
              <hr>
              <p><em>Please ensure all listed visitors are accounted for during evacuation.</em></p>
            `
          }
        });

        toast.success(`Evacuation list sent - ${checkedInVisitors.length} visitors to account for`);
      } else {
        toast.info('No visitors currently checked in');
      }

    } catch (error) {
      console.error('Error processing evacuation:', error);
      toast.error('Failed to process evacuation procedure');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur border-red-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Emergency Procedures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emergency Alert Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Siren className="h-4 w-4 text-red-500" />
              Emergency Alert System
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {emergencyTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={emergencyType === type.value ? "default" : "outline"}
                  onClick={() => setEmergencyType(type.value)}
                  className={`${emergencyType === type.value ? type.color : ''} text-sm h-auto p-3 flex flex-col items-center gap-1`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-xs text-center">{type.label}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Emergency Details</span>
                {isVoiceSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className={`${isListening ? 'bg-red-500/20 border-red-500' : 'border-border'}`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isListening ? 'Stop' : 'Voice'}
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Provide detailed information about the emergency... (or use voice input)"
                value={emergencyDetails || finalTranscript}
                onChange={(e) => {
                  setEmergencyDetails(e.target.value);
                  if (finalTranscript) resetTranscript();
                }}
                className="bg-input border-border text-white min-h-[100px]"
              />
              {isListening && (
                <div className="text-xs text-blue-400 animate-pulse">
                  🎤 Listening... (automatically stops after 3 seconds of silence)
                </div>
              )}
              {transcript && !emergencyDetails && (
                <div className="text-xs text-gray-400">
                  Voice input detected. Click "Voice" again to use this text or continue typing.
                </div>
              )}
            </div>

            <Button
              onClick={handleEmergencyAlert}
              disabled={isProcessing || !emergencyType || !emergencyDetails.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Sending Alert...' : 'Send Emergency Alert'}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <Button
              onClick={handleEvacuationProcedure}
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 h-auto p-4 bg-purple-600 hover:bg-purple-700"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Building Evacuation</span>
            </Button>

            <Button
              onClick={() => window.open('tel:911', '_self')}
              className="flex flex-col items-center gap-2 h-auto p-4 bg-red-600 hover:bg-red-700"
            >
              <Phone className="h-6 w-6" />
              <span className="text-sm">Call 911</span>
            </Button>

            <Button
              onClick={() => window.open('tel:+1234567890', '_self')} // Replace with security hotline
              className="flex flex-col items-center gap-2 h-auto p-4 bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Security Hotline</span>
            </Button>
          </div>

          {/* Enhanced Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">System Status:</span>
              <span className={`flex items-center gap-2 ${
                isOnline ? 'text-green-400' : criticalMode ? 'text-red-400' : 'text-yellow-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-400' : criticalMode ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'
                }`}></div>
                {isOnline 
                  ? 'Online - Alerts will send immediately' 
                  : criticalMode 
                    ? 'Critical Mode - Extended offline period'
                    : 'Offline - Alerts queued for sync'
                }
              </span>
            </div>
            
            {pendingCriticalActions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Pending Critical Actions:</span>
                <span className="text-red-400 font-medium">{pendingCriticalActions}</span>
              </div>
            )}
            
            {isVoiceSupported && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Voice Input:</span>
                <span className="text-green-400">Available</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};