import React from 'react';
import { Zap, Droplets, Thermometer, Shield, Users, Lightbulb, Wrench, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];

interface QuickTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: RequestPriority;
  icon: React.ReactNode;
  estimatedTime: string;
  commonLocations: string[];
}

interface QuickIssueTemplatesProps {
  categories: any[];
  onSelectTemplate: (template: {
    title: string;
    description: string;
    category?: string;
    priority?: RequestPriority;
    location?: string;
  }) => void;
}

const quickTemplates: QuickTemplate[] = [
  {
    id: 'electrical-outage',
    title: 'Power Outage',
    description: 'Electrical power is not working in my area. No lights or electrical outlets are functioning.',
    category: 'electrical',
    priority: 'urgent',
    icon: <Zap className="w-5 h-5 text-red-500" />,
    estimatedTime: '30 min',
    commonLocations: ['Office', 'Conference Room', 'Break Room', 'Entire Floor']
  },
  {
    id: 'water-leak',
    title: 'Water Leak',
    description: 'I noticed water leaking from the ceiling/pipe/faucet. The area is getting wet and needs immediate attention.',
    category: 'plumbing',
    priority: 'high',
    icon: <Droplets className="w-5 h-5 text-blue-500" />,
    estimatedTime: '1 hour',
    commonLocations: ['Bathroom', 'Kitchen', 'Ceiling', 'Basement']
  },
  {
    id: 'hvac-issue',
    title: 'AC Not Working',
    description: 'The air conditioning system is not working properly. The temperature is uncomfortable.',
    category: 'hvac',
    priority: 'medium',
    icon: <Thermometer className="w-5 h-5 text-orange-500" />,
    estimatedTime: '2 hours',
    commonLocations: ['Office', 'Conference Room', 'Entire Floor', 'Lobby']
  },
  {
    id: 'access-issue',
    title: 'Door/Access Problem',
    description: 'Unable to access the area due to door lock malfunction or access card not working.',
    category: 'security',
    priority: 'medium',
    icon: <Shield className="w-5 h-5 text-purple-500" />,
    estimatedTime: '45 min',
    commonLocations: ['Office Door', 'Main Entrance', 'Parking Garage', 'Elevator']
  },
  {
    id: 'lighting-issue',
    title: 'Lighting Problem',
    description: 'Lights are flickering, too dim, or not working at all in this area.',
    category: 'electrical',
    priority: 'low',
    icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
    estimatedTime: '30 min',
    commonLocations: ['Office', 'Hallway', 'Bathroom', 'Parking Area']
  },
  {
    id: 'cleaning-request',
    title: 'Cleaning Request',
    description: 'The area needs cleaning attention. There may be spills, stains, or general maintenance needed.',
    category: 'cleaning',
    priority: 'low',
    icon: <Users className="w-5 h-5 text-green-500" />,
    estimatedTime: '1 hour',
    commonLocations: ['Office', 'Break Room', 'Bathroom', 'Lobby']
  },
  {
    id: 'general-repair',
    title: 'General Repair',
    description: 'Something is broken or damaged and needs repair. Please see attached photos for details.',
    category: 'general',
    priority: 'medium',
    icon: <Wrench className="w-5 h-5 text-gray-500" />,
    estimatedTime: '1-2 hours',
    commonLocations: ['Office', 'Common Area', 'Furniture', 'Equipment']
  }
];

const QuickIssueTemplates: React.FC<QuickIssueTemplatesProps> = ({
  categories,
  onSelectTemplate
}) => {
  const getCategoryId = (categoryName: string) => {
    return categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase())
    )?.id;
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleTemplateSelect = (template: QuickTemplate) => {
    onSelectTemplate({
      title: template.title,
      description: template.description,
      category: getCategoryId(template.category),
      priority: template.priority
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Quick Issue Templates</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Select a common issue type to quickly fill out your request:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-3 cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {template.icon}
                      <h4 className="font-medium text-sm">{template.title}</h4>
                    </div>
                    <Badge variant={getPriorityColor(template.priority)} className="text-xs">
                      {template.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Est. {template.estimatedTime}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 <strong>Tip:</strong> Templates help speed up your request and ensure all necessary details are included.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickIssueTemplates;