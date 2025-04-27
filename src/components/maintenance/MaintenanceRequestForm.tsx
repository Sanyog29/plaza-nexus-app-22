
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
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [estimatedTime] = useState(120);
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
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([{
          title,
          description,
          category_id: selectedCategory,
          location,
          reported_by: userId,
          priority: 'medium',
          status: 'pending'
        }])
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
    }
  };

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
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
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
              disabled={isLoading}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      <SLATimerPreview estimatedTime={estimatedTime} />
      
      <RequestAttachments isLoading={isLoading} />
      
      <Button 
        type="submit" 
        className="w-full bg-plaza-blue hover:bg-blue-700"
        disabled={isLoading}
      >
        <Send size={18} className="mr-2" />
        {isLoading ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
};

export default MaintenanceRequestForm;
