import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Save, AlertTriangle, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { useEnhancedOfflineMode } from '@/hooks/useEnhancedOfflineMode';
import { useCrossModuleIntegration } from '@/hooks/useCrossModuleIntegration';
import { supabase } from '@/integrations/supabase/client';

interface VoiceIncidentReportProps {
  visitorId?: string;
  onReportSaved?: () => void;
}

export const VoiceIncidentReport: React.FC<VoiceIncidentReportProps> = ({
  visitorId,
  onReportSaved
}) => {
  const [incidentType, setIncidentType] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportComplete, setReportComplete] = useState(false);

  const { isOnline, addOfflineAction } = useEnhancedOfflineMode();
  const { processVisitorEvent } = useCrossModuleIntegration();
  
  const {
    isListening,
    transcript,
    finalTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceToText({
    continuous: true,
    interimResults: true
  });

  const incidentTypes = [
    { value: 'security', label: 'Security Incident', priority: 'high' },
    { value: 'medical', label: 'Medical Emergency', priority: 'critical' },
    { value: 'equipment_damage', label: 'Equipment Damage', priority: 'medium' },
    { value: 'safety_hazard', label: 'Safety Hazard', priority: 'high' },
    { value: 'behavioral', label: 'Behavioral Issue', priority: 'medium' },
    { value: 'access_violation', label: 'Access Violation', priority: 'high' },
    { value: 'property_damage', label: 'Property Damage', priority: 'medium' },
    { value: 'other', label: 'Other Incident', priority: 'low' }
  ];

  const currentIncidentType = incidentTypes.find(t => t.value === incidentType);
  const combinedReport = finalTranscript + (manualNotes ? `\n\nAdditional Notes: ${manualNotes}` : '');

  // Auto-save transcript to manual notes when voice input stops
  useEffect(() => {
    if (finalTranscript && !isListening && !manualNotes.includes(finalTranscript)) {
      setManualNotes(prev => {
        const separator = prev ? '\n\n' : '';
        return prev + separator + finalTranscript;
      });
      resetTranscript();
    }
  }, [finalTranscript, isListening, manualNotes, resetTranscript]);

  const handleSaveReport = async () => {
    if (!incidentType) {
      toast.error('Please select an incident type');
      return;
    }

    if (!combinedReport.trim()) {
      toast.error('Please provide incident details via voice or text');
      return;
    }

    setIsProcessing(true);
    try {
      const reportData = {
        visitor_id: visitorId || null,
        action_type: 'incident_report',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        location: 'Security Desk',
        notes: `Incident Report: ${currentIncidentType?.label}\n\n${combinedReport}`,
        metadata: {
          incident_type: incidentType,
          priority: currentIncidentType?.priority,
          voice_input_used: finalTranscript.length > 0,
          report_length: combinedReport.length,
          timestamp: new Date().toISOString(),
          requiresIntegration: ['security', 'medical', 'equipment_damage'].includes(incidentType),
          event_type: incidentType === 'medical' ? 'medical_emergency' : 
                      incidentType === 'equipment_damage' ? 'equipment_damage' : 
                      incidentType === 'security' ? 'security_incident' : 'general_incident'
        }
      };

      if (isOnline) {
        const { error } = await supabase
          .from('visitor_check_logs')
          .insert(reportData);

        if (error) throw error;

        // Trigger cross-module integration for specific incident types
        if (visitorId && reportData.metadata.requiresIntegration) {
          await processVisitorEvent(
            visitorId,
            reportData.metadata.event_type,
            {
              incidentType,
              details: combinedReport,
              priority: currentIncidentType?.priority,
              location: 'Security Desk',
              facilityDamage: incidentType === 'equipment_damage' || incidentType === 'property_damage'
            }
          );
        }

        toast.success('Incident report saved successfully');
      } else {
        // Add to offline queue with appropriate priority
        const priority = currentIncidentType?.priority === 'critical' ? 'critical' : 
                        currentIncidentType?.priority === 'high' ? 'high' : 'medium';
        
        addOfflineAction('incident_report', reportData, priority);
        toast.warning('Incident report queued - will sync when online');
      }

      setReportComplete(true);
      onReportSaved?.();
      
      // Auto-reset form after 3 seconds
      setTimeout(() => {
        setIncidentType('');
        setManualNotes('');
        resetTranscript();
        setReportComplete(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving incident report:', error);
      toast.error('Failed to save incident report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setIncidentType('');
    setManualNotes('');
    resetTranscript();
    setReportComplete(false);
    if (isListening) stopListening();
  };

  if (reportComplete) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-green-400 mb-2">Report Saved</h3>
          <p className="text-gray-300">
            Incident report has been {isOnline ? 'saved' : 'queued for sync'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Voice Incident Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-500 text-sm">
                Voice input not supported in this browser. Text input only.
              </span>
            </div>
          </div>
        )}

        {/* Incident Type Selection */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Incident Type</label>
          <Select value={incidentType} onValueChange={setIncidentType}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select incident type..." />
            </SelectTrigger>
            <SelectContent>
              {incidentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{type.label}</span>
                    <Badge 
                      variant={type.priority === 'critical' ? 'destructive' : 
                              type.priority === 'high' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {type.priority}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Input Section */}
        {isSupported && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm font-medium">Voice Report</label>
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
              >
                {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isListening ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
            
            {isListening && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-sm">Recording... (stops after 3 seconds of silence)</span>
                </div>
                {transcript && (
                  <div className="text-gray-300 text-sm italic">
                    "{transcript}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Notes */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">
            Additional Notes {isSupported && '(Voice input will be added here)'}
          </label>
          <Textarea
            value={manualNotes}
            onChange={(e) => setManualNotes(e.target.value)}
            placeholder="Type additional details or use voice input above..."
            className="bg-input border-border text-white min-h-[120px]"
            rows={6}
          />
        </div>

        {/* Report Preview */}
        {combinedReport.trim() && (
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Report Preview</label>
            <div className="bg-card/30 border border-border rounded-lg p-3 text-gray-300 text-sm max-h-32 overflow-y-auto">
              <strong>Incident Type:</strong> {currentIncidentType?.label}<br />
              <strong>Priority:</strong> <Badge variant={currentIncidentType?.priority === 'critical' ? 'destructive' : 'default'}>
                {currentIncidentType?.priority}
              </Badge><br /><br />
              <strong>Details:</strong><br />
              {combinedReport}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isProcessing}
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleSaveReport}
            disabled={isProcessing || !incidentType || !combinedReport.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Saving...' : 'Save Report'}
          </Button>
        </div>

        {/* Status Info */}
        <div className="text-xs text-gray-400 text-center pt-2">
          {isOnline ? '🟢 Online - Reports saved immediately' : '🟡 Offline - Reports queued for sync'}
          {visitorId && ' • Linked to visitor record'}
        </div>
      </CardContent>
    </Card>
  );
};