import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, LogIn, LogOut, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ShiftManagementProps {
  activeShift?: any;
  onShiftStart?: () => void;
  onShiftEnd?: () => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({ 
  activeShift, 
  onShiftStart, 
  onShiftEnd 
}) => {
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showEndDialog, setShowEndDialog] = useState(false);

  const startShift = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.rpc('start_security_shift');
      
      if (error) {
        if (error.message.includes('already has an active shift')) {
          toast.error('You already have an active shift running');
        } else {
          toast.error('Failed to start shift: ' + error.message);
        }
        return;
      }

      toast.success('Shift started successfully');
      onShiftStart?.();
      
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
    } finally {
      setStarting(false);
    }
  };

  const endShift = async () => {
    setEnding(true);
    try {
      const { data, error } = await supabase.rpc('end_security_shift', {
        handover_notes: handoverNotes || null
      });
      
      if (error) {
        toast.error('Failed to end shift: ' + error.message);
        return;
      }

      toast.success('Shift ended successfully');
      setShowEndDialog(false);
      setHandoverNotes('');
      onShiftEnd?.();
      
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Failed to end shift');
    } finally {
      setEnding(false);
    }
  };

  const getShiftDuration = () => {
    if (!activeShift?.shift_start) return '00:00';
    
    const start = new Date(activeShift.shift_start);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (!activeShift) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-plaza-blue mx-auto mb-2" />
          <p className="text-white mb-3">Ready to start your shift?</p>
          <Button 
            onClick={startShift} 
            disabled={starting}
            className="bg-green-600 hover:bg-green-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {starting ? 'Starting...' : 'Start Shift'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-white">Active Shift</p>
              <p className="text-xs text-gray-400">
                Started: {format(new Date(activeShift.shift_start), 'HH:mm')}
              </p>
              <p className="text-xs text-plaza-blue">
                Duration: {getShiftDuration()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            End Shift
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card text-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>End Security Shift</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="text-sm">
                <strong>Shift Duration:</strong> {getShiftDuration()}
              </p>
              <p className="text-sm">
                <strong>Started:</strong> {format(new Date(activeShift.shift_start), 'PPpp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="handover" className="text-white">
                <FileText className="h-4 w-4 inline mr-1" />
                Handover Notes (Optional)
              </Label>
              <Textarea
                id="handover"
                placeholder="Add any important notes for the next shift..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="bg-input border-border text-white resize-none"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEndDialog(false)}
                disabled={ending}
              >
                Cancel
              </Button>
              <Button 
                onClick={endShift}
                disabled={ending}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {ending ? 'Ending...' : 'End Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};