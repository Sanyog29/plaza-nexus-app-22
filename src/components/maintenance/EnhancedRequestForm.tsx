
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SLATimerPreview from './SLATimerPreview';
import RequestAttachments from './RequestAttachments';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestStatus = Database['public']['Enums']['request_status'];

interface EnhancedRequestFormProps {
  categories: any[];
  isLoading: boolean;
  userId?: string;
}

const EnhancedRequestForm: React.FC<EnhancedRequestFormProps> = ({ 
  categories, 
  isLoading,
  userId 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [estimatedTime, setEstimatedTime] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Group categories to remove duplicates and organize them
  const groupedCategories = React.useMemo(() => {
    const categoryMap = new Map();
    categories.forEach(category => {
      const name = category.name.toLowerCase();
      if (!categoryMap.has(name) || categoryMap.get(name).created_at < category.created_at) {
        categoryMap.set(name, category);
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      description: 'Non-urgent issues - 8 hour response',
      color: 'text-green-600'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      description: 'Standard issues - 4 hour response',
      color: 'text-yellow-600'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      description: 'Important issues - 2 hour response',
      color: 'text-orange-600'
    },
    { 
      value: 'urgent', 
      label: 'Urgent Priority', 
      description: 'Critical issues - 1 hour response',
      color: 'text-red-600'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !title || !description || !location) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title,
          description,
          category_id: selectedCategory,
          location,
          reported_by: userId,
          priority,
          status: 'pending' as RequestStatus
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;

      setCreatedRequestId(data.id);
      
      toast({
        title: "Request submitted",
        description: `Your maintenance request has been submitted successfully${attachmentFiles.length > 0 ? '. You can now upload your attachments.' : ''}`,
      });

      if (attachmentFiles.length === 0) {
        navigate('/requests');
      }
      
    } catch (error: any) {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesChange = (files: File[]) => {
    setAttachmentFiles(files);
  };

  // Update estimated time based on priority
  React.useEffect(() => {
    switch (priority) {
      case 'low':
        setEstimatedTime(480); // 8 hours
        break;
      case 'medium':
        setEstimatedTime(240); // 4 hours
        break;
      case 'high':
        setEstimatedTime(120); // 2 hours
        break;
      case 'urgent':
        setEstimatedTime(60); // 1 hour
        break;
      default:
        setEstimatedTime(240);
    }
  }, [priority]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-card border-gray-600"
          disabled={isLoading || submitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Provide details about your request..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="bg-card border-gray-600"
          disabled={isLoading || submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          placeholder="Where is the issue located?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-card border-gray-600"
          disabled={isLoading || submitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading || submitting}>
          <SelectTrigger className="bg-card border-gray-600">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-card border-gray-600 max-h-60">
            {groupedCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="text-xs text-gray-400">{category.description}</div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority *</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as RequestPriority)} disabled={isLoading || submitting}>
          <SelectTrigger className="bg-card border-gray-600">
            <SelectValue placeholder="Select priority level" />
          </SelectTrigger>
          <SelectContent className="bg-card border-gray-600">
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="hover:bg-gray-800">
                <div className="flex flex-col gap-1">
                  <div className={`font-medium ${option.color}`}>{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <SLATimerPreview estimatedTime={estimatedTime} />
      
      <RequestAttachments 
        isLoading={isLoading || submitting} 
        onFilesChange={handleFilesChange}
        requestId={createdRequestId}
      />
      
      <Button 
        type="submit" 
        className="w-full bg-plaza-blue hover:bg-blue-700"
        disabled={isLoading || submitting}
      >
        <Send size={18} className="mr-2" />
        {submitting ? 'Submitting...' : 
         createdRequestId ? 'Request Created - Upload Files Above' : 
         'Submit Request'}
      </Button>
      
      {createdRequestId && attachmentFiles.length === 0 && (
        <Button 
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/requests')}
        >
          Continue Without Attachments
        </Button>
      )}
    </form>
  );
};

export default EnhancedRequestForm;
