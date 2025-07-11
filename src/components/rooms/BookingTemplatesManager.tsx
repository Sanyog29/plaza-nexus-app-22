import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bookmark, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface BookingTemplate {
  id: string;
  template_name: string;
  title: string;
  description: string;
  duration_minutes: number;
  room_type_preference: string;
  capacity_needed: number;
  equipment_needed: string[];
  buffer_time_minutes: number;
  created_at: string;
}

const BookingTemplatesManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BookingTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    title: '',
    description: '',
    duration_minutes: 60,
    room_type_preference: '',
    capacity_needed: '',
    equipment_needed: [] as string[],
    buffer_time_minutes: 15
  });

  // Fetch user's booking templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['booking-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('booking_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BookingTemplate[];
    },
    enabled: !!user
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const { error } = await supabase
        .from('booking_templates')
        .insert({
          ...templateData,
          user_id: user!.id,
          capacity_needed: templateData.capacity_needed ? parseInt(templateData.capacity_needed) : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] });
      toast({
        title: "Template Created",
        description: "Booking template created successfully",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: any) => {
      const { error } = await supabase
        .from('booking_templates')
        .update({
          ...templateData,
          capacity_needed: templateData.capacity_needed ? parseInt(templateData.capacity_needed) : null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] });
      toast({
        title: "Template Updated",
        description: "Booking template updated successfully",
      });
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('booking_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] });
      toast({
        title: "Template Deleted",
        description: "Booking template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      title: '',
      description: '',
      duration_minutes: 60,
      room_type_preference: '',
      capacity_needed: '',
      equipment_needed: [],
      buffer_time_minutes: 15
    });
  };

  const handleEdit = (template: BookingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      title: template.title,
      description: template.description || '',
      duration_minutes: template.duration_minutes,
      room_type_preference: template.room_type_preference || '',
      capacity_needed: template.capacity_needed?.toString() || '',
      equipment_needed: template.equipment_needed || [],
      buffer_time_minutes: template.buffer_time_minutes
    });
  };

  const handleSubmit = () => {
    if (!formData.template_name.trim() || !formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the template name and title",
        variant: "destructive",
      });
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const equipmentOptions = [
    'Projector', 'Whiteboard', 'TV Screen', 'Video Conferencing', 
    'Microphone', 'Laptop', 'Conference Phone', 'Flipchart'
  ];

  if (isLoading) return <div>Loading templates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Booking Templates</h3>
          <p className="text-gray-400">Save common meeting setups for quick booking</p>
        </div>
        
        <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="e.g., Weekly Team Meeting"
                />
              </div>

              <div>
                <Label htmlFor="title">Default Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Team Standup"
                />
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={formData.duration_minutes.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity Needed</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity_needed}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_needed: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buffer">Buffer Time (minutes)</Label>
                <Select 
                  value={formData.buffer_time_minutes.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, buffer_time_minutes: parseInt(value) }))}
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTemplate(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="bg-card">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg">{template.template_name}</CardTitle>
                  <CardDescription className="text-gray-400">{template.title}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the template "{template.template_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {template.description && (
                <p className="text-sm text-gray-300">{template.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{template.duration_minutes} min</span>
                </div>
                {template.capacity_needed && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{template.capacity_needed} people</span>
                  </div>
                )}
              </div>

              {template.equipment_needed && template.equipment_needed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.equipment_needed.map((equipment) => (
                    <Badge key={equipment} variant="secondary" className="text-xs">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              )}

              {template.buffer_time_minutes > 0 && (
                <div className="text-xs text-gray-500">
                  Buffer time: {template.buffer_time_minutes} minutes
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No booking templates yet. Create your first template to save time on recurring meetings.</p>
        </div>
      )}
    </div>
  );
};

export default BookingTemplatesManager;