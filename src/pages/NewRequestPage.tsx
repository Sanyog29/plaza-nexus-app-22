
import React, { useState } from 'react';
import { ArrowLeft, Send, Image, Paperclip } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'it', name: 'IT Support' },
  { id: 'security', name: 'Security' },
  { id: 'other', name: 'Other' },
];

const NewRequestPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
          <Label htmlFor="category">Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={selectedCategory === category.id 
                  ? "bg-plaza-blue hover:bg-blue-700" 
                  : "border-gray-600 hover:bg-gray-800"
                }
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        
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
            rows={4}
            className="bg-card border-gray-600"
          />
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
