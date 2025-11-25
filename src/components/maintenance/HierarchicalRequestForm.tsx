import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import DragDropAttachments from './DragDropAttachments';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  mainCategoryId: z.string().min(1, 'Please select a category'),
  issueType: z.string(),
  customIssueType: z.string().optional(),
  buildingAreaId: z.string().min(1, 'Please select an area'),
  buildingFloorId: z.string().min(1, 'Please select a floor'),
  processId: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'critical']),
  is_crisis: z.boolean().optional()
}).refine((data) => {
  if (data.issueType === '__custom__') {
    return data.customIssueType && data.customIssueType.trim().length >= 3;
  }
  return data.issueType && data.issueType.trim().length > 0;
}, {
  message: "Please select an issue type or describe your custom issue",
  path: ["issueType"]
})
.refine((data) => {
  if (data.issueType === '__custom__') {
    return data.customIssueType && data.customIssueType.trim().length >= 3;
  }
  return true;
}, {
  message: "Please describe your custom issue (minimum 3 characters)",
  path: ["customIssueType"]
});

type FormData = z.infer<typeof formSchema>;

interface MainCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface IssueTypeMapping {
  name: string;
  default_priority: string;
  response_sla_minutes: number;
  resolution_sla_minutes: number;
}

// Category to Issue Type mappings
const CATEGORY_ISSUE_MAPPINGS: Record<string, IssueTypeMapping[]> = {
  'Workstation & Furniture': [
    { name: 'Chair broken', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 },
    { name: 'Desk alignment', default_priority: 'low', response_sla_minutes: 480, resolution_sla_minutes: 2880 },
    { name: 'Locker not opening', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ],
  'Electrical & Lighting': [
    { name: 'Power outage', default_priority: 'urgent', response_sla_minutes: 30, resolution_sla_minutes: 120 },
    { name: 'Socket fault', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 },
    { name: 'UPS failure', default_priority: 'high', response_sla_minutes: 60, resolution_sla_minutes: 240 },
    { name: 'Light not working', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ],
  'HVAC & Air Quality': [
    { name: 'AC breakdown (bay)', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 },
    { name: 'Uneven cooling', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 },
    { name: 'Filter cleaning', default_priority: 'low', response_sla_minutes: 480, resolution_sla_minutes: 2880 }
  ],
  'Plumbing & Washrooms': [
    { name: 'Flush not working', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 },
    { name: 'Tap leakage', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'No water supply', default_priority: 'urgent', response_sla_minutes: 30, resolution_sla_minutes: 120 }
  ],
  'Housekeeping & Cleaning': [
    { name: 'Daily cleaning', default_priority: 'medium', response_sla_minutes: 480, resolution_sla_minutes: 1440 },
    { name: 'Dusting', default_priority: 'low', response_sla_minutes: 720, resolution_sla_minutes: 2880 },
    { name: 'Deep cleaning', default_priority: 'low', response_sla_minutes: 1440, resolution_sla_minutes: 4320 },
    { name: 'Pest control', default_priority: 'high', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ],
  'Pantry & F&B': [
    { name: 'Coffee machine down', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'Stock shortage', default_priority: 'low', response_sla_minutes: 480, resolution_sla_minutes: 1440 },
    { name: 'Vendor delay', default_priority: 'low', response_sla_minutes: 720, resolution_sla_minutes: 2880 }
  ],
  'Security & Access Control': [
    { name: 'ID card issues', default_priority: 'high', response_sla_minutes: 60, resolution_sla_minutes: 240 },
    { name: 'Turnstile not working', default_priority: 'high', response_sla_minutes: 60, resolution_sla_minutes: 240 },
    { name: 'CCTV fault', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 }
  ],
  'IT & Connectivity': [
    { name: 'Wi-Fi down', default_priority: 'high', response_sla_minutes: 60, resolution_sla_minutes: 240 },
    { name: 'Printer error', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'LAN port dead', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 }
  ],
  'AV & Meeting Rooms': [
    { name: 'VC not connecting', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 },
    { name: 'Display not working', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'Booking issue', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 }
  ],
  'Lifts & Vertical Transport': [
    { name: 'Lift breakdown', default_priority: 'urgent', response_sla_minutes: 15, resolution_sla_minutes: 60 },
    { name: 'Stuck lift', default_priority: 'critical', response_sla_minutes: 5, resolution_sla_minutes: 30 },
    { name: 'Call button not working', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 }
  ],
  'Building Services': [
    { name: 'Ceiling tile damage', default_priority: 'medium', response_sla_minutes: 480, resolution_sla_minutes: 2880 },
    { name: 'Wall painting', default_priority: 'low', response_sla_minutes: 1440, resolution_sla_minutes: 7200 },
    { name: 'Glass crack', default_priority: 'high', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ],
  'Environment & Sustainability': [
    { name: 'Waste segregation', default_priority: 'medium', response_sla_minutes: 480, resolution_sla_minutes: 1440 },
    { name: 'Recycling', default_priority: 'low', response_sla_minutes: 720, resolution_sla_minutes: 2880 },
    { name: 'Solar/energy issues', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ],
  'Health & Safety': [
    { name: 'Fire alarm', default_priority: 'critical', response_sla_minutes: 5, resolution_sla_minutes: 30 },
    { name: 'First aid', default_priority: 'urgent', response_sla_minutes: 10, resolution_sla_minutes: 60 },
    { name: 'PPE', default_priority: 'high', response_sla_minutes: 120, resolution_sla_minutes: 480 },
    { name: 'Fire drills', default_priority: 'medium', response_sla_minutes: 480, resolution_sla_minutes: 1440 }
  ],
  'Business Support & Admin': [
    { name: 'Courier', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'Stationery', default_priority: 'low', response_sla_minutes: 480, resolution_sla_minutes: 1440 },
    { name: 'Visitor support', default_priority: 'medium', response_sla_minutes: 120, resolution_sla_minutes: 480 }
  ],
  'Events & Community': [
    { name: 'Space booking', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'Event support', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 720 },
    { name: 'Surveys', default_priority: 'low', response_sla_minutes: 720, resolution_sla_minutes: 2880 }
  ],
  'Other/General': [
    { name: 'Any unclassified', default_priority: 'medium', response_sla_minutes: 240, resolution_sla_minutes: 1440 }
  ]
};

interface BuildingArea {
  id: string;
  name: string;
  description: string;
  zone_type: string;
}

interface BuildingFloor {
  id: string;
  name: string;
  floor_number: number;
}

interface SLAInfo {
  response_sla_minutes: number;
  resolution_sla_minutes: number;
}

interface HierarchicalRequestFormProps {
  onSuccess?: () => void;
}

const HierarchicalRequestForm: React.FC<HierarchicalRequestFormProps> = ({ onSuccess }) => {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [availableIssueTypes, setAvailableIssueTypes] = useState<IssueTypeMapping[]>([]);
  const [buildingAreas, setBuildingAreas] = useState<BuildingArea[]>([]);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [slaInfo, setSlaInfo] = useState<SLAInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCustomIssueType, setShowCustomIssueType] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentProperty } = usePropertyContext();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mainCategoryId: '',
      issueType: '',
      customIssueType: '',
      buildingAreaId: '',
      buildingFloorId: '',
      processId: '',
      priority: 'medium',
      is_crisis: false
    }
  });

  const selectedMainCategory = form.watch('mainCategoryId');
  const selectedIssueType = form.watch('issueType');
  const selectedPriority = form.watch('priority');

  // Get current location on mobile
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const position = await Geolocation.getCurrentPosition();
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        console.log('Location access denied or unavailable');
      }
    };

    getCurrentLocation();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingCategories(true);
        
        const [categoriesResult, areasResult, floorsResult, processesResult] = await Promise.all([
          supabase.from('main_categories').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('building_areas').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('building_floors').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('maintenance_processes').select('*').eq('is_active', true).order('display_order')
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (areasResult.error) throw areasResult.error;
        if (floorsResult.error) throw floorsResult.error;

        setMainCategories(categoriesResult.data || []);
        setBuildingAreas(areasResult.data || []);
        setBuildingFloors(floorsResult.data || []);
        setProcesses(processesResult.data || []);
      } catch (error: any) {
        toast({
          title: "Error loading form data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadData();
  }, [toast]);

  // Load issue types when main category changes
  useEffect(() => {
    if (!selectedMainCategory) {
      setAvailableIssueTypes([]);
      setShowCustomIssueType(false);
      return;
    }

    const selectedCategoryData = mainCategories.find(cat => cat.id === selectedMainCategory);
    if (!selectedCategoryData) return;

    const issueTypes = CATEGORY_ISSUE_MAPPINGS[selectedCategoryData.name] || [];
    setAvailableIssueTypes(issueTypes);
    
    // Reset issue type selection
    form.setValue('issueType', '');
    form.setValue('customIssueType', '');
    setShowCustomIssueType(false);
  }, [selectedMainCategory, mainCategories, form]);

  // Update priority and SLA when issue type changes
  useEffect(() => {
    if (selectedIssueType === '__custom__') {
      setShowCustomIssueType(true);
      // Set default SLA for custom issues
      setSlaInfo({
        response_sla_minutes: 240,
        resolution_sla_minutes: 1440
      });
      return;
    }

    const selectedIssue = availableIssueTypes.find(issue => issue.name === selectedIssueType);
    if (selectedIssue) {
      form.setValue('priority', selectedIssue.default_priority as any);
      setSlaInfo({
        response_sla_minutes: selectedIssue.response_sla_minutes,
        resolution_sla_minutes: selectedIssue.resolution_sla_minutes
      });
    }
  }, [selectedIssueType, availableIssueTypes, form]);

  const formatSLATime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (minutes < 1440) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: { label: 'P1 - Critical', color: 'destructive', description: 'Life-safety risk or service outage affecting >25% users' },
      critical: { label: 'P1 - Critical', color: 'destructive', description: 'Life-safety risk or service outage affecting >25% users' },
      high: { label: 'P2 - High', color: 'destructive', description: 'Severe disruption to a team/floor or compliance risk' },
      medium: { label: 'P3 - Medium', color: 'secondary', description: 'Single-user productivity impact or aesthetic issue' },
      low: { label: 'P4 - Low', color: 'outline', description: 'No immediate impact; planned task' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const handleNotListedSelection = () => {
    form.setValue('issueType', '__custom__');
    setShowCustomIssueType(true);
    
    const currentTitle = form.getValues('title');
    const isAutoFilledFromIssue = availableIssueTypes.some(issue => 
      currentTitle.includes(issue.name)
    );
    
    if (isAutoFilledFromIssue || !currentTitle) {
      form.setValue('title', '');
    }
    
    toast({
      title: "Custom issue enabled",
      description: "Describe your issue - it will be used as your request title.",
    });
  };

  const uploadPendingFiles = async (requestId: string) => {
    for (const file of pendingFiles) {
      try {
        // Create unique file path
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('maintenance-attachments')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: "File upload warning",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        // Insert attachment record
        const { error: insertError } = await supabase
          .from('request_attachments')
          .insert({
            request_id: requestId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileName,
            uploaded_by: user!.id,
            attachment_type: 'user_upload'
          });

        if (insertError) {
          console.error('Attachment record error:', insertError);
          toast({
            title: "Attachment warning",
            description: `File uploaded but failed to link to request: ${file.name}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Attachment processing error:', error);
        toast({
          title: "File processing error",
          description: `Error processing ${file.name}`,
          variant: "destructive"
        });
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a request",
        variant: "destructive"
      });
      return;
    }

    if (!currentProperty?.id) {
      toast({
        title: "Property Required",
        description: "Please select a property before submitting a request",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formValues = form.getValues();
      
      // Map priority to allowed enum values to ensure safety
      const safePriority = ['urgent', 'high', 'medium', 'low', 'critical'].includes(data.priority) 
        ? (data.priority === 'critical' ? 'urgent' : data.priority) 
        : 'medium';
      
      const finalIssueType = data.issueType === '__custom__' 
        ? (data.customIssueType?.trim() || 'Custom Issue')
        : data.issueType;

      if (!finalIssueType || finalIssueType.trim().length === 0) {
        toast({
          title: "Invalid issue type",
          description: "Please select or describe an issue type",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      const requestData = {
        title: data.title,
        description: data.description,
        location: `${buildingAreas.find(a => a.id === data.buildingAreaId)?.name || ''} - ${buildingFloors.find(f => f.id === data.buildingFloorId)?.name || ''}`,
        category_id: data.mainCategoryId, // This now correctly points to main_categories
        issue_type: finalIssueType,
        building_area_id: data.buildingAreaId,
        building_floor_id: data.buildingFloorId,
        process_id: data.processId || null,
        priority: safePriority,
        status: 'pending' as const,
        reported_by: user.id,
        gps_coordinates: currentLocation || null,
        auto_detected_location: !!currentLocation,
        is_crisis: Boolean(formValues.is_crisis),
        property_id: currentProperty.id
      };

      console.log('Submitting request data:', requestData);

      const { data: result, error } = await supabase
        .from('maintenance_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', { 
          code: error.code, 
          details: error.details, 
          hint: error.hint, 
          message: error.message 
        });
        throw error;
      }

      // Upload pending files to the created request
      if (pendingFiles.length > 0) {
        await uploadPendingFiles(result.id);
      }

      toast({
        title: "Request submitted successfully!",
        description: "Your maintenance request has been created and assigned."
      });

      form.reset();
      setSlaInfo(null);
      setPendingFiles([]);
      setShowCustomIssueType(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedMainCategoryData = mainCategories.find(cat => cat.id === selectedMainCategory);
  const priorityConfig = getPriorityConfig(selectedPriority);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Submit Maintenance Request
        </CardTitle>
        <CardDescription>
          Use the dropdowns below to categorize your request for faster resolution
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Category */}
              <FormField
                control={form.control}
                name="mainCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {mainCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issue Type */}
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === '__not_listed__') {
                          handleNotListedSelection();
                        } else {
                          field.onChange(value);
                          setShowCustomIssueType(false);
                        }
                      }} 
                      value={field.value} 
                      disabled={!selectedMainCategory}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {availableIssueTypes.length > 0 ? (
                          <>
                            {availableIssueTypes.map((issueType) => (
                              <SelectItem key={issueType.name} value={issueType.name}>
                                {issueType.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__not_listed__" className="text-primary font-medium border-t border-border mt-1 pt-2">
                              💭 My issue isn't mentioned here
                            </SelectItem>
                          </>
                        ) : selectedMainCategory ? (
                          <SelectItem value="__not_listed__" className="text-primary font-medium">
                            💭 Describe your issue
                          </SelectItem>
                        ) : (
                          <SelectItem value="__no_selection__" disabled>
                            Please select a category first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Issue Type Input */}
              {showCustomIssueType && (
                <FormField
                  control={form.control}
                  name="customIssueType"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Describe your issue *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Water cooler not working, Broken window latch" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const customIssue = e.target.value.trim();
                            if (customIssue.length > 0) {
                              form.setValue('title', customIssue);
                            }
                          }}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 This will be used as your request title
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {/* Custom Issue Preview */}
              {showCustomIssueType && form.watch('customIssueType') && (
                <div className="col-span-1 md:col-span-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Custom Issue Preview</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issue Type: <span className="font-medium text-foreground">{form.watch('customIssueType')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Title: <span className="font-medium text-foreground">{form.watch('title')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Building Area */}
              <FormField
                control={form.control}
                name="buildingAreaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {buildingAreas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{area.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Building Floor */}
              <FormField
                control={form.control}
                name="buildingFloorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {buildingFloors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Process */}
              <FormField
                control={form.control}
                name="processId"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Process (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select process..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {processes.map((process) => (
                          <SelectItem key={process.id} value={process.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{process.name}</span>
                              {process.description && (
                                <span className="text-xs text-muted-foreground">{process.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority Display */}
            {(selectedIssueType || showCustomIssueType) && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Auto-assigned Priority:</span>
                  <Badge variant={priorityConfig.color as any}>{priorityConfig.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 text-left">{priorityConfig.description}</p>
                
                {slaInfo && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>Response: {formatSLATime(slaInfo.response_sla_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>Resolution: {formatSLATime(slaInfo.resolution_sla_minutes)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief description of the issue" 
                      {...field} 
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed information about the issue, including any relevant context or steps to reproduce the problem"
                      className="min-h-[100px] bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Info */}
            {currentLocation && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <MapPin className="h-4 w-4" />
                  <span>Location detected automatically</span>
                </div>
              </div>
            )}

            {/* Enhanced Attachments Section */}
            <div className="space-y-2">
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-1">
                  📸 For faster resolution, please attach photos or screenshots
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500">
                  Clear images help our team understand and prioritize your request
                </p>
              </div>
              
              <DragDropAttachments 
                isLoading={isSubmitting}
                onFilesChange={(files) => setPendingFiles(files)}
                showTips={true}
                maxFiles={5}
              />
            </div>

            <div className="relative z-[60] pointer-events-auto">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default HierarchicalRequestForm;
