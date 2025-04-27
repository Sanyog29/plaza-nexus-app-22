
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

const categories = [
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'cleaning', name: 'Housekeeping' },
  { id: 'it', name: 'IT Support' },
  { id: 'security', name: 'Security' },
  { id: 'hvac', name: 'HVAC' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'other', name: 'Other' },
];

const NewRequestPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(120); // Example: 120 minutes to resolve
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Handle AI categorization
  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (title && description && description.length > 10 && descriptionFocused) {
        setIsAnalyzing(true);
        
        try {
          const response = await supabase.functions.invoke('categorize-request', {
            body: { title, description },
          });
          
          if (response.data?.category) {
            setAiSuggestion(response.data.category);
            
            // Auto-select the suggested category if no category is currently selected
            if (!selectedCategory) {
              setSelectedCategory(response.data.category);
              
              toast({
                title: "Category suggested",
                description: `AI suggested: ${categories.find(cat => cat.id === response.data.category)?.name || 'Unknown'}`,
                variant: "default",
              });
            }
          }
        } catch (error) {
          console.error('Error calling categorize-request:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(debounceTimeout);
  }, [title, description, descriptionFocused, selectedCategory, toast]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !title || !description) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we would send this data to an API
    console.log({
      category: selectedCategory,
      title,
      description,
      timestamp: new Date().toISOString(),
      estimatedResolutionTime: estimatedTime,
    });
    
    toast({
      title: "Request submitted",
      description: "Your request has been submitted successfully",
    });
    
    navigate('/requests');
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
          />
        </div>
        
        {isAnalyzing && (
          <div className="bg-blue-900/20 p-3 rounded-md flex items-center gap-2 text-sm">
            <Sparkles size={16} className="text-plaza-blue animate-pulse" />
            <span className="text-blue-300">AI is analyzing your request...</span>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="category">Category</Label>
            {aiSuggestion && (
              <Badge variant="outline" className="text-plaza-blue border-plaza-blue flex items-center gap-1">
                <Sparkles size={12} className="text-plaza-blue" />
                AI suggested
              </Badge>
            )}
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
                } ${
                  aiSuggestion === category.id && selectedCategory !== category.id
                    ? "border-plaza-blue border-dashed"
                    : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
                {aiSuggestion === category.id && (
                  <Sparkles size={14} className="ml-2 text-yellow-300" />
                )}
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
            <Button type="button" variant="outline" className="border-gray-600">
              <Image size={20} className="mr-2" />
              Photo
            </Button>
            <Button type="button" variant="outline" className="border-gray-600">
              <Paperclip size={20} className="mr-2" />
              Attach
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-plaza-blue hover:bg-blue-700"
        >
          <Send size={18} className="mr-2" />
          Submit Request
        </Button>
      </form>
    </div>
  );
};

export default NewRequestPage;
