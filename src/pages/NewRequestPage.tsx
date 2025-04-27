
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Image, Paperclip, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';

const NewRequestPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(120);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_categories')
        .select('*');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([{
          title,
          description,
          category_id: selectedCategory,
          location,
          reported_by: user?.id,
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
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-6">
        <Link to="/requests" className="mr-4">
          <ArrowLeft size={24} className="text-white" />
        </Link>
        <h2 className="text-2xl font-bold text-white">New Request</h2>
      </div>
      
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
        
        {/* SLA Timer Visualization Preview */}
        <div className="space-y-2 bg-card/50 backdrop-blur p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <Label>Estimated Resolution Time</Label>
            <Badge 
              variant="outline" 
              className={estimatedTime > 60 ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400"}
            >
              {estimatedTime > 60 ? (
                <CheckCircle size={14} className="mr-1" />
              ) : (
                <AlertTriangle size={14} className="mr-1" />
              )}
              {Math.floor(estimatedTime / 60)}h {estimatedTime % 60}m
            </Badge>
          </div>
          <Progress value={Math.min(100, (estimatedTime / 240) * 100)} className="h-2" />
          <p className="text-xs text-gray-400 mt-1">
            Based on similar requests, this issue typically takes around {Math.floor(estimatedTime / 60)} hours and {estimatedTime % 60} minutes to resolve.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Attachments</Label>
          <div className="flex space-x-4">
            <Button type="button" variant="outline" className="border-gray-600" disabled={isLoading}>
              <Image size={20} className="mr-2" />
              Photo
            </Button>
            <Button type="button" variant="outline" className="border-gray-600" disabled={isLoading}>
              <Paperclip size={20} className="mr-2" />
              Attach
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-plaza-blue hover:bg-blue-700"
          disabled={isLoading}
        >
          <Send size={18} className="mr-2" />
          {isLoading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </div>
  );
};

export default NewRequestPage;
