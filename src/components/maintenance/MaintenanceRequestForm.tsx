import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SLATimerPreview from './SLATimerPreview';
import RequestAttachments from './RequestAttachments';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestStatus = Database['public']['Enums']['request_status'];

interface MaintenanceRequestFormProps {
  categories: any[];
  isLoading: boolean;
  userId?: string;
}

const MaintenanceRequestForm: React.FC<MaintenanceRequestFormProps> = ({ 
  categories, 
  isLoading,
  userId 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Request submitted",
        description: "Your maintenance request has been submitted successfully",
      });
      
      navigate('/requests');
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
        <Label htmlFor="title">Title</Label>
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide details about your request..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setDescriptionFocused(true)}
          onBlur={() => setDescriptionFocused(false)}
          rows={4}
          className="bg-card border-gray-600"
          disabled={isLoading || submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
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
        <div className="flex justify-between">
          <Label htmlFor="category">Category</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`${
                selectedCategory === category.id 
                  ? "bg-plaza-blue hover:bg-blue-700" 
                  : "border-gray-600 hover:bg-gray-800"
              }`}
              onClick={() => setSelectedCategory(category.id)}
              disabled={isLoading || submitting}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <RadioGroup 
          value={priority} 
          onValueChange={(value) => setPriority(value as RequestPriority)} 
          className="flex space-x-2"
          disabled={isLoading || submitting}
        >
          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-md flex-1 text-center">
            <RadioGroupItem value="low" id="low" className="sr-only" />
            <Label htmlFor="low" className="cursor-pointer flex-1">Low</Label>
          </div>
          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-md flex-1 text-center">
            <RadioGroupItem value="medium" id="medium" className="sr-only" />
            <Label htmlFor="medium" className="cursor-pointer flex-1">Medium</Label>
          </div>
          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-md flex-1 text-center">
            <RadioGroupItem value="high" id="high" className="sr-only" />
            <Label htmlFor="high" className="cursor-pointer flex-1">High</Label>
          </div>
          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-md flex-1 text-center">
            <RadioGroupItem value="urgent" id="urgent" className="sr-only" />
            <Label htmlFor="urgent" className="cursor-pointer flex-1">Urgent</Label>
          </div>
        </RadioGroup>
      </div>
      
      <SLATimerPreview estimatedTime={estimatedTime} />
      
      <RequestAttachments isLoading={isLoading || submitting} />
      
      <Button 
        type="submit" 
        className="w-full bg-plaza-blue hover:bg-blue-700"
        disabled={isLoading || submitting}
      >
        <Send size={18} className="mr-2" />
        {submitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
};

export default MaintenanceRequestForm;
