import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';
import type { Json } from '@/integrations/supabase/types';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

interface DailyChecklistDB {
  id: string;
  checklist_type: string;
  zone: string;
  checklist_items: Json;
  photo_urls: string[];
  completion_status: string;
  completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  staff_id: string;
  updated_at: string;
}

interface DailyChecklist {
  id: string;
  checklist_type: string;
  zone: string;
  checklist_items: ChecklistItem[];
  photo_urls: string[];
  completion_status: 'pending' | 'completed' | 'approved';
  completed_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
}

const CHECKLIST_TEMPLATES = {
  ac_maintenance: [
    { id: '1', text: 'Check AC filter condition', required: true, completed: false },
    { id: '2', text: 'Clean AC vents', required: true, completed: false },
    { id: '3', text: 'Check temperature controls', required: true, completed: false },
    { id: '4', text: 'Verify proper cooling', required: false, completed: false }
  ],
  cleaning: [
    { id: '1', text: 'Vacuum/sweep floors', required: true, completed: false },
    { id: '2', text: 'Empty trash bins', required: true, completed: false },
    { id: '3', text: 'Clean washrooms', required: true, completed: false },
    { id: '4', text: 'Wipe down surfaces', required: true, completed: false },
    { id: '5', text: 'Check supply levels', required: false, completed: false }
  ],
  security: [
    { id: '1', text: 'Check all entry points', required: true, completed: false },
    { id: '2', text: 'Test security systems', required: true, completed: false },
    { id: '3', text: 'Log visitor entries', required: true, completed: false },
    { id: '4', text: 'Patrol designated areas', required: true, completed: false }
  ]
};

export function useDailyChecklists() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<DailyChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChecklists();
    }
  }, [user]);

  const fetchChecklists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_checklists')
        .select('*')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: DailyChecklist[] = (data as DailyChecklistDB[] || []).map(item => ({
        id: item.id,
        checklist_type: item.checklist_type,
        zone: item.zone,
        checklist_items: Array.isArray(item.checklist_items) 
          ? (item.checklist_items as unknown as ChecklistItem[])
          : [],
        photo_urls: item.photo_urls,
        completion_status: item.completion_status as 'pending' | 'completed' | 'approved',
        completed_at: item.completed_at || undefined,
        approved_by: item.approved_by || undefined,
        approved_at: item.approved_at || undefined,
        notes: item.notes || undefined,
        created_at: item.created_at
      }));
      
      setChecklists(transformedData);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast.error('Failed to load checklists');
    }
  };

  const createChecklist = async (type: keyof typeof CHECKLIST_TEMPLATES, zone: string) => {
    if (!user) return null;

    // Check if checklist already exists for today
    const today = new Date().toDateString();
    const existingToday = checklists.find(c => 
      c.checklist_type === type && 
      c.zone === zone &&
      new Date(c.created_at).toDateString() === today
    );

    if (existingToday) {
      toast.error('Checklist already exists for today');
      return existingToday;
    }

    setIsLoading(true);
    try {
      const template = CHECKLIST_TEMPLATES[type];
      const { data, error } = await supabase
        .from('daily_checklists')
        .insert({
          staff_id: user.id,
          checklist_type: type,
          zone,
          checklist_items: template as unknown as Json
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      await fetchChecklists();
      toast.success('Checklist created');
      return data;
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error('Failed to create checklist');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateChecklistItem = async (checklistId: string, itemId: string, completed: boolean) => {
    setIsLoading(true);
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      const updatedItems = checklist.checklist_items.map(item =>
        item.id === itemId ? { ...item, completed } : item
      );

      const { error } = await supabase
        .from('daily_checklists')
        .update({ checklist_items: updatedItems as unknown as Json })
        .eq('id', checklistId);

      if (error) throw error;

      await fetchChecklists();
      toast.success('Checklist updated');
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (checklistId: string, file: File) => {
    if (!user) return null;

    setIsUploading(true);
    try {
      const fileName = `checklist-${checklistId}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('maintenance-attachments')
        .getPublicUrl(fileName);

      // Update checklist with photo URL
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      const updatedPhotoUrls = [...(checklist.photo_urls || []), urlData.publicUrl];

      const { error: updateError } = await supabase
        .from('daily_checklists')
        .update({ photo_urls: updatedPhotoUrls })
        .eq('id', checklistId);

      if (updateError) throw updateError;

      await fetchChecklists();
      toast.success('Photo uploaded');
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const completeChecklist = async (checklistId: string, notes?: string) => {
    setIsLoading(true);
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      // Check if all required items are completed
      const requiredItems = checklist.checklist_items.filter(item => item.required);
      const completedRequired = requiredItems.filter(item => item.completed);

      if (completedRequired.length !== requiredItems.length) {
        toast.error('Please complete all required items');
        return false;
      }

      const { error } = await supabase
        .from('daily_checklists')
        .update({
          completion_status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', checklistId);

      if (error) throw error;

      await fetchChecklists();
      toast.success('Checklist completed');
      return true;
    } catch (error) {
      console.error('Error completing checklist:', error);
      toast.error('Failed to complete checklist');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaysChecklists = () => {
    const today = new Date().toDateString();
    return checklists.filter(checklist => 
      new Date(checklist.created_at).toDateString() === today
    );
  };

  return {
    checklists,
    isLoading,
    isUploading,
    createChecklist,
    updateChecklistItem,
    uploadPhoto,
    completeChecklist,
    getTodaysChecklists,
    refetch: fetchChecklists,
    CHECKLIST_TEMPLATES
  };
}