import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Repeat, Save, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';

interface EnhancedBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  selectedDate: Date;
  selectedTime: string;
}

interface BookingTemplate {
  id: string;
  template_name: string;
  title: string;
  description: string;
  duration_minutes: number;
  equipment_needed: string[];
  buffer_time_minutes: number;
}

const EnhancedBookingDialog: React.FC<EnhancedBookingDialogProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  selectedDate,
  selectedTime
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: 'Meeting',
    description: '',
    duration: 60,
    attendeeCount: '',
    agenda: '',
    bufferTime: 15,
    equipment: [] as string[],
    isRecurring: false,
    recurrenceFrequency: 'weekly',
    recurrenceEndDate: addDays(selectedDate, 30),
    saveAsTemplate: false,
    templateName: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Fetch user's booking templates
  const { data: templates = [] } = useQuery({
    queryKey: ['booking-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('booking_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('template_name');
      
      if (error) throw error;
      return data as BookingTemplate[];
    },
    enabled: !!user
  });

  // Apply template to form
  const applyTemplate = (template: BookingTemplate) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      duration: template.duration_minutes,
      equipment: template.equipment_needed || [],
      bufferTime: template.buffer_time_minutes
    }));
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const startTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`);
      const endTime = new Date(startTime.getTime() + formData.duration * 60 * 1000);

      const booking = {
        room_id: roomId,
        user_id: user!.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        title: formData.title,
        description: formData.description || null,
        status: 'confirmed',
        duration_minutes: formData.duration,
        attendee_count: formData.attendeeCount ? parseInt(formData.attendeeCount) : null,
        meeting_agenda: formData.agenda || null,
        buffer_time_minutes: formData.bufferTime,
        equipment_needed: formData.equipment.length > 0 ? formData.equipment : null,
        is_recurring: formData.isRecurring,
        recurrence_rule: formData.isRecurring ? {
          frequency: formData.recurrenceFrequency,
          end_date: formData.recurrenceEndDate.toISOString().split('T')[0]
        } : null
      };

      const { data, error } = await supabase
        .from('room_bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;

      // Generate recurring bookings if needed
      if (formData.isRecurring) {
        const { error: recurrenceError } = await supabase.rpc('generate_recurring_bookings', {
          base_booking_id: data.id,
          recurrence_rule: booking.recurrence_rule,
          end_date: formData.recurrenceEndDate.toISOString().split('T')[0]
        });

        if (recurrenceError) {
          console.warn('Failed to create some recurring bookings:', recurrenceError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      toast({
        title: "Room Booked Successfully",
        description: formData.isRecurring 
          ? `Created recurring booking for ${roomName}`
          : `Booked ${roomName} for ${selectedTime} on ${selectedDate.toLocaleDateString()}`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const template = {
        user_id: user!.id,
        template_name: formData.templateName,
        title: formData.title,
        description: formData.description,
        duration_minutes: formData.duration,
        equipment_needed: formData.equipment.length > 0 ? formData.equipment : null,
        buffer_time_minutes: formData.bufferTime
      };

      const { error } = await supabase
        .from('booking_templates')
        .insert(template);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] });
      toast({
        title: "Template Saved",
        description: `Template "${formData.templateName}" saved successfully`,
      });
    }
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a meeting title",
        variant: "destructive",
      });
      return;
    }

    // Save template if requested
    if (formData.saveAsTemplate && formData.templateName.trim()) {
      await saveTemplateMutation.mutateAsync();
    }

    // Create booking
    createBookingMutation.mutate({});
  };

  const equipmentOptions = [
    'Projector', 'Whiteboard', 'TV Screen', 'Video Conferencing', 
    'Microphone', 'Laptop', 'Conference Phone', 'Flipchart'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Book {roomName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter meeting title"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={formData.duration.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendees">Number of Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  value={formData.attendeeCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendeeCount: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="buffer">Buffer Time (minutes)</Label>
                <Select 
                  value={formData.bufferTime.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bufferTime: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="agenda">Meeting Agenda</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="Meeting agenda (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label>Equipment Needed</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {equipmentOptions.map((equipment) => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment}
                      checked={formData.equipment.includes(equipment)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            equipment: [...prev.equipment, equipment] 
                          }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            equipment: prev.equipment.filter(e => e !== equipment) 
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={equipment} className="text-sm">{equipment}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: !!checked }))}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Make this a recurring meeting
              </Label>
            </div>

            {formData.isRecurring && (
              <>
                <div>
                  <Label htmlFor="frequency">Repeat Frequency</Label>
                  <Select 
                    value={formData.recurrenceFrequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurrenceFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Calendar
                    mode="single"
                    selected={formData.recurrenceEndDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, recurrenceEndDate: date }))}
                    disabled={(date) => date < selectedDate}
                    className="rounded-md border"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {templates.length > 0 && (
              <div>
                <Label htmlFor="template">Use Existing Template</Label>
                <Select 
                  value={selectedTemplate} 
                  onValueChange={(value) => {
                    setSelectedTemplate(value);
                    const template = templates.find(t => t.id === value);
                    if (template) applyTemplate(template);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="saveTemplate"
                  checked={formData.saveAsTemplate}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveAsTemplate: !!checked }))}
                />
                <Label htmlFor="saveTemplate" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save as template
                </Label>
              </div>

              {formData.saveAsTemplate && (
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={formData.templateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createBookingMutation.isPending}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            {createBookingMutation.isPending ? 'Booking...' : 'Book Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedBookingDialog;