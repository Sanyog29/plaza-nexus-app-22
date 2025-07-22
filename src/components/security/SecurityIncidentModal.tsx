
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AlertTriangle } from 'lucide-react';

interface SecurityIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentReported: () => void;
}

const SecurityIncidentModal: React.FC<SecurityIncidentModalProps> = ({
  isOpen,
  onClose,
  onIncidentReported
}) => {
  const [incidentType, setIncidentType] = useState<string>('security_incident');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<string>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase.from('visitor_check_logs').insert({
        action_type: incidentType,
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: location,
        notes: description,
        metadata: {
          severity: severity,
          resolved: false,
          reportedAt: new Date().toISOString()
        }
      });
      
      if (error) throw error;
      
      onIncidentReported();
      resetForm();
    } catch (error: any) {
      console.error('Error reporting incident:', error);
      toast.error('Failed to report incident: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setIncidentType('security_incident');
    setLocation('');
    setDescription('');
    setSeverity('medium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Security Incident
          </DialogTitle>
          <DialogDescription>
            Please provide details about the security incident or alert
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select 
              value={incidentType} 
              onValueChange={setIncidentType}
            >
              <SelectTrigger id="incident-type">
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="security_incident">Security Incident</SelectItem>
                <SelectItem value="emergency_alert">Emergency Alert</SelectItem>
                <SelectItem value="access_denied">Access Denied</SelectItem>
                <SelectItem value="policy_violation">Policy Violation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="Where did the incident occur?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select 
              value={severity} 
              onValueChange={setSeverity}
            >
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Provide details about the incident"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && (
                <span className="animate-spin">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              )}
              Report Incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityIncidentModal;
