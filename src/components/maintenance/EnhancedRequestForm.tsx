import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MapPin, Mic, Camera, Clock, Zap, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Database } from '@/integrations/supabase/types';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedRequestAttachments from './EnhancedRequestAttachments';
import SmartLocationDetector from './SmartLocationDetector';
import QuickIssueTemplates from './QuickIssueTemplates';

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
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string>('');
  const [suggestedPriority, setSuggestedPriority] = useState<RequestPriority>('medium');
  const [aiSuggestions, setAiSuggestions] = useState<{
    category?: string;
    urgency?: string;
    estimatedTime?: number;
  }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Voice to text integration
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceToText();

  // Auto-populate description from voice
  useEffect(() => {
    if (transcript) {
      setDescription(transcript.trim());
    }
  }, [transcript]);

  // Smart categorization based on description
  useEffect(() => {
    if (description && description.length > 10) {
      analyzeDescription(description);
    }
  }, [description]);

  const analyzeDescription = async (text: string) => {
    const keywords = {
      urgent: ['emergency', 'broken', 'not working', 'urgent', 'immediate', 'danger', 'safety'],
      high: ['leak', 'sparking', 'smoke', 'loud noise', 'overheating'],
      electrical: ['electric', 'power', 'outlet', 'switch', 'light', 'electrical'],
      plumbing: ['water', 'leak', 'drain', 'toilet', 'faucet', 'pipe'],
      hvac: ['air', 'heat', 'cold', 'temperature', 'hvac', 'ac', 'ventilation'],
      security: ['access', 'card', 'door', 'lock', 'security'],
      cleaning: ['clean', 'dirty', 'spill', 'trash', 'maintenance']
    };

    const lowerText = text.toLowerCase();
    
    // Analyze urgency
    if (keywords.urgent.some(word => lowerText.includes(word))) {
      setSuggestedPriority('urgent');
    } else if (keywords.high.some(word => lowerText.includes(word))) {
      setSuggestedPriority('high');
    }

    // Suggest category
    let suggestedCategoryName = '';
    if (keywords.electrical.some(word => lowerText.includes(word))) {
      suggestedCategoryName = 'Electrical';
    } else if (keywords.plumbing.some(word => lowerText.includes(word))) {
      suggestedCategoryName = 'Plumbing';
    } else if (keywords.hvac.some(word => lowerText.includes(word))) {
      suggestedCategoryName = 'HVAC';
    } else if (keywords.security.some(word => lowerText.includes(word))) {
      suggestedCategoryName = 'Security';
    } else if (keywords.cleaning.some(word => lowerText.includes(word))) {
      suggestedCategoryName = 'Cleaning';
    }

    if (suggestedCategoryName) {
      const category = categories.find(cat => 
        cat.name.toLowerCase().includes(suggestedCategoryName.toLowerCase())
      );
      if (category && !selectedCategory) {
        setAiSuggestions(prev => ({ 
          ...prev, 
          category: category.id,
          urgency: suggestedPriority 
        }));
      }
    }
  };

  const handleQuickTemplate = (template: {
    title: string;
    description: string;
    category?: string;
    priority?: RequestPriority;
    location?: string;
  }) => {
    setTitle(template.title);
    setDescription(template.description);
    if (template.category) setSelectedCategory(template.category);
    if (template.priority) setPriority(template.priority);
    if (template.location) setLocation(template.location);
  };

  const handleLocationDetected = (detectedLoc: string) => {
    setDetectedLocation(detectedLoc);
    if (!location) {
      setLocation(detectedLoc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !title || !description || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields to submit your request",
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
        title: "Request Submitted Successfully! 🎉",
        description: `Your request has been submitted and assigned ID: ${data.id.slice(0, 8)}. You'll receive updates shortly.`,
      });

      // Auto-navigate if no attachments
      if (attachmentFiles.length === 0) {
        setTimeout(() => navigate('/requests'), 1500);
      }
      
    } catch (error: any) {
      toast({
        title: "Submission Failed",
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

  const applySuggestion = (type: 'category' | 'priority') => {
    if (type === 'category' && aiSuggestions.category) {
      setSelectedCategory(aiSuggestions.category);
    } else if (type === 'priority' && aiSuggestions.urgency) {
      setPriority(aiSuggestions.urgency as RequestPriority);
    }
    setAiSuggestions(prev => ({ ...prev, [type]: undefined }));
  };

  const getPriorityIcon = (p: RequestPriority) => {
    switch (p) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Issue Templates */}
      <QuickIssueTemplates
        categories={categories}
        onSelectTemplate={handleQuickTemplate}
      />

      {/* Smart Location Detection */}
      <SmartLocationDetector
        onLocationDetected={handleLocationDetected}
        currentLocation={location}
      />

      {/* AI Suggestions */}
      {(aiSuggestions.category || aiSuggestions.urgency) && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                🤖
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">AI Suggestions</h4>
                <div className="space-y-2 mt-2">
                  {aiSuggestions.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-700">
                        Suggested Category: 
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('category')}
                        className="text-xs h-7"
                      >
                        Apply {categories.find(c => c.id === aiSuggestions.category)?.name}
                      </Button>
                    </div>
                  )}
                  {aiSuggestions.urgency && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-700">
                        Suggested Priority:
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('priority')}
                        className="text-xs h-7"
                      >
                        {getPriorityIcon(aiSuggestions.urgency as RequestPriority)}
                        Apply {aiSuggestions.urgency}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Issue Title *</Label>
          <Input
            id="title"
            placeholder="Brief description of the issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background border-border"
            disabled={isLoading || submitting}
          />
        </div>
        
        {/* Description with Voice Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description *</Label>
            {voiceSupported && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading || submitting}
                  className={isListening ? 'bg-red-50 border-red-200' : ''}
                >
                  <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
                  {isListening ? 'Stop' : 'Voice'}
                </Button>
                {transcript && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetTranscript}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
          <Textarea
            id="description"
            placeholder="Provide details about your request... (You can use voice input)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="bg-background border-border"
            disabled={isLoading || submitting}
          />
          {interimTranscript && (
            <p className="text-sm text-muted-foreground italic">
              Speaking: "{interimTranscript}"
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <div className="relative">
            <Input
              id="location"
              placeholder="Where is the issue located?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-border"
              disabled={isLoading || submitting}
            />
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {detectedLocation && detectedLocation !== location && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocation(detectedLocation)}
              className="text-xs"
            >
              Use detected: {detectedLocation}
            </Button>
          )}
        </div>
        
        {/* Category Selection */}
        <div className="space-y-2">
          <Label>Category *</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`justify-start ${
                  selectedCategory === category.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedCategory(category.id)}
                disabled={isLoading || submitting}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div className="space-y-2">
          <Label>Priority *</Label>
          <RadioGroup 
            value={priority} 
            onValueChange={(value) => setPriority(value as RequestPriority)} 
            className="grid grid-cols-2 gap-2"
            disabled={isLoading || submitting}
          >
            {(['low', 'medium', 'high', 'urgent'] as RequestPriority[]).map((p) => (
              <div key={p} className="flex items-center space-x-2 bg-card p-3 rounded-lg border">
                <RadioGroupItem value={p} id={p} />
                <Label htmlFor={p} className="cursor-pointer flex items-center gap-2 flex-1">
                  {getPriorityIcon(p)}
                  <span className="capitalize">{p}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {suggestedPriority !== priority && suggestedPriority !== 'medium' && (
            <Badge variant="outline" className="text-xs">
              AI suggests: {suggestedPriority} priority
            </Badge>
          )}
        </div>
        
        {/* Enhanced Attachments */}
        <EnhancedRequestAttachments 
          isLoading={isLoading || submitting} 
          onFilesChange={handleFilesChange}
          requestId={createdRequestId}
        />
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || submitting}
          size="lg"
        >
          <Send size={18} className="mr-2" />
          {submitting ? 'Submitting Request...' : 
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
    </div>
  );
};

export default EnhancedRequestForm;