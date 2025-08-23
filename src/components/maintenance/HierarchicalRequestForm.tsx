import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
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
  subCategoryId: z.string().min(1, 'Please select a sub-category'),
  buildingAreaId: z.string().min(1, 'Please select an area'),
  buildingFloorId: z.string().min(1, 'Please select a floor'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  is_crisis: z.boolean().optional()
});

type FormData = z.infer<typeof formSchema>;

interface MainCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface SubCategory {
  id: string;
  name: string;
  default_priority: string;
  response_sla_minutes: number;
  resolution_sla_minutes: number;
}

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
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [buildingAreas, setBuildingAreas] = useState<BuildingArea[]>([]);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [slaInfo, setSlaInfo] = useState<SLAInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingNotListed, setPendingNotListed] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mainCategoryId: '',
      subCategoryId: '',
      buildingAreaId: '',
      buildingFloorId: '',
      priority: 'medium',
      is_crisis: false
    }
  });

  const selectedMainCategory = form.watch('mainCategoryId');
  const selectedSubCategory = form.watch('subCategoryId');
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
        
        const [categoriesResult, areasResult, floorsResult] = await Promise.all([
          supabase.from('main_categories').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('building_areas').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('building_floors').select('*').eq('is_active', true).order('sort_order')
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (areasResult.error) throw areasResult.error;
        if (floorsResult.error) throw floorsResult.error;

        setMainCategories(categoriesResult.data || []);
        setBuildingAreas(areasResult.data || []);
        setBuildingFloors(floorsResult.data || []);
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

  // Load sub-categories when main category changes
  useEffect(() => {
    const loadSubCategories = async () => {
      if (!selectedMainCategory) {
        setSubCategories([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sub_categories')
          .select('*')
          .eq('main_category_id', selectedMainCategory)
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setSubCategories(data || []);
        
        // Reset sub-category selection unless pending not listed
        if (!pendingNotListed) {
          form.setValue('subCategoryId', '');
        }

        // Handle pending "not listed" selection
        if (pendingNotListed && data) {
          const notListedSub = data.find(sub => 
            sub.name.toLowerCase().includes('not listed') || 
            sub.name.toLowerCase().includes('describe')
          );
          
          if (notListedSub) {
            form.setValue('subCategoryId', notListedSub.id);
            setTimeout(() => form.setFocus('description'), 100);
            toast({
              title: "Category selected",
              description: "Please describe your issue below."
            });
          } else {
            toast({
              title: "Please describe your issue",
              description: "Choose any subcategory and provide details in the description."
            });
          }
          
          setPendingNotListed(false);
        }
      } catch (error: any) {
        toast({
          title: "Error loading sub-categories",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    loadSubCategories();
  }, [selectedMainCategory, form, toast, pendingNotListed]);

  // Update priority and SLA when sub-category changes
  useEffect(() => {
    const selectedSub = subCategories.find(sub => sub.id === selectedSubCategory);
    if (selectedSub) {
      form.setValue('priority', selectedSub.default_priority as any);
      setSlaInfo({
        response_sla_minutes: selectedSub.response_sla_minutes,
        resolution_sla_minutes: selectedSub.resolution_sla_minutes
      });
    }
  }, [selectedSubCategory, subCategories, form]);

  const formatSLATime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      critical: { label: 'P1 - Critical', color: 'destructive', description: 'Life-safety risk or service outage affecting >25% users' },
      high: { label: 'P2 - High', color: 'destructive', description: 'Severe disruption to a team/floor or compliance risk' },
      medium: { label: 'P3 - Medium', color: 'secondary', description: 'Single-user productivity impact or aesthetic issue' },
      low: { label: 'P4 - Low', color: 'outline', description: 'No immediate impact; planned task' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const handleNotListedSelection = () => {
    const otherCategory = mainCategories.find(cat => 
      cat.name.toLowerCase().includes('other') || 
      cat.name.toLowerCase().includes('general')
    );
    
    if (!otherCategory) {
      toast({
        title: "Please select any category",
        description: "Choose any category and describe your issue in detail.",
        variant: "default"
      });
      return;
    }

    // Set the Other/General category and mark pending
    form.setValue('mainCategoryId', otherCategory.id);
    setPendingNotListed(true);
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

    setIsSubmitting(true);

    try {
      const requestData = {
        title: data.title,
        description: data.description,
        location: `${buildingAreas.find(a => a.id === data.buildingAreaId)?.name || ''} - ${buildingFloors.find(f => f.id === data.buildingFloorId)?.name || ''}`,
        main_category_id: data.mainCategoryId,
        sub_category_id: data.subCategoryId,
        building_area_id: data.buildingAreaId,
        building_floor_id: data.buildingFloorId,
        priority: data.priority === 'critical' ? 'urgent' : data.priority as 'urgent' | 'high' | 'medium' | 'low',
        status: 'pending' as const,
        reported_by: user.id,
        gps_coordinates: currentLocation ? JSON.stringify(currentLocation) : null,
        auto_detected_location: !!currentLocation,
        is_crisis: (form.getValues() as any).is_crisis || false
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .insert([requestData]);

      if (error) throw error;

      toast({
        title: "Request submitted successfully!",
        description: "Your maintenance request has been created and assigned."
      });

      form.reset();
      setSlaInfo(null);
      onSuccess?.();
    } catch (error: any) {
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

              {/* Sub Category */}
              <FormField
                control={form.control}
                name="subCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === '__not_listed__') {
                          handleNotListedSelection();
                        } else {
                          field.onChange(value);
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
                            {subCategories.length > 0 ? (
                              <>
                                {subCategories.map((subCategory) => (
                                  <SelectItem key={subCategory.id} value={subCategory.id}>
                                    {subCategory.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__not_listed__" className="text-primary font-medium border-t border-border mt-1 pt-2">
                                  💭 My issue isn't mentioned here
                                </SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="__no_options__" disabled>
                                  No issue types found for this category
                                </SelectItem>
                                <SelectItem value="__not_listed__" className="text-primary font-medium mt-1">
                                  💭 My issue isn't mentioned here
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {/* Priority Display */}
            {selectedSubCategory && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Auto-assigned Priority:</span>
                  <Badge variant={priorityConfig.color as any}>{priorityConfig.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{priorityConfig.description}</p>
                
                {slaInfo && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>Response: {formatSLATime(slaInfo.response_sla_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-600" />
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
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                  📸 For faster resolution, please attach photos or screenshots
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  Clear images help our team understand and prioritize your request
                </p>
              </div>
              
              <DragDropAttachments 
                isLoading={isSubmitting}
                onFilesChange={(files) => {
                  // Handle file changes if needed
                }}
                showTips={true}
                maxFiles={5}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default HierarchicalRequestForm;