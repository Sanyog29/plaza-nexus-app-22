
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Map, User, HardDrive, Download, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface InfoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
}

interface InfoItem {
  id: string;
  category_id: string;
  title: string;
  description: string;
  content: string;
  file_url: string;
  file_size: string;
  file_type: string;
  image_url: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  display_order: number;
  updated_at: string;
}

const InfoHubPage = () => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<InfoItem | null>(null);
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['info-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as InfoCategory[];
    },
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['info-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as InfoItem[];
    },
  });

  const getItemsForCategory = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return [];
    return items.filter(item => item.category_id === category.id);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'building':
        return <Building className="h-4 w-4 mr-2" />;
      case 'user':
        return <User className="h-4 w-4 mr-2" />;
      case 'hard-drive':
        return <HardDrive className="h-4 w-4 mr-2" />;
      case 'map':
        return <Map className="h-4 w-4 mr-2" />;
      default:
        return <Building className="h-4 w-4 mr-2" />;
    }
  };
  
  const handleDownload = (item: InfoItem) => {
    console.log(`Downloading ${item.title}`);
    if (item.file_url && item.file_url !== '#') {
      window.open(item.file_url, '_blank');
    } else {
      alert(`Downloading ${item.title} - File not available yet`);
    }
  };

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Information Hub</h2>
          <p className="text-sm text-gray-400 mt-1">Access building information and resources</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Information Hub</h2>
        <p className="text-sm text-gray-400 mt-1">Access building information and resources</p>
      </div>

      <Tabs defaultValue="floor-plans" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 bg-card/50">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.name} 
              className="data-[state=active]:bg-plaza-blue"
            >
              {getCategoryIcon(category.icon)}
              {category.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="floor_plans">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Floor Plans & Emergency Maps</CardTitle>
              <CardDescription>Building layouts and evacuation routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getItemsForCategory('floor_plans').map((plan) => (
                  <div 
                    key={plan.id} 
                    className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-card/80 cursor-pointer"
                    onClick={() => setSelectedFloorPlan(plan)}
                  >
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-plaza-blue mr-3" />
                      <div>
                        <p className="font-medium text-white">{plan.title}</p>
                        <p className="text-sm text-gray-400">{plan.description}</p>
                        <p className="text-xs text-gray-500">Updated: {new Date(plan.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(plan);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {selectedFloorPlan && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white mb-3">{selectedFloorPlan.title}</h3>
                  <div className="border border-border rounded-md overflow-hidden">
                    <img 
                      src={selectedFloorPlan.image_url || '/placeholder.svg'} 
                      alt={selectedFloorPlan.title} 
                      className="w-full h-auto max-h-[400px] object-contain bg-black/20"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleDownload(selectedFloorPlan)}
                    >
                      <Download className="h-4 w-4" />
                      Download Full Resolution
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Admin Contact Directory</CardTitle>
              <CardDescription>Key personnel contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getItemsForCategory('contacts').map((contact) => (
                  <div key={contact.id} className="p-4 border border-border rounded-md">
                    <div className="flex items-start">
                      <div className="bg-card/60 p-2 rounded-full mr-3">
                        <User className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{contact.title}</h4>
                        <p className="text-sm text-gray-400">{contact.contact_role}</p>
                        <p className="text-xs text-gray-500 mt-1">{contact.description}</p>
                        <div className="space-y-1 mt-2 text-sm">
                          {contact.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-plaza-blue" />
                              <a href={`mailto:${contact.contact_email}`} className="text-plaza-blue hover:underline">
                                {contact.contact_email}
                              </a>
                            </div>
                          )}
                          {contact.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-plaza-blue" />
                              <a href={`tel:${contact.contact_phone}`} className="text-plaza-blue hover:underline">
                                {contact.contact_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Downloadable Resources</CardTitle>
              <CardDescription>Access important building documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getItemsForCategory('resources').map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border border-border rounded-md">
                    <div className="flex items-center">
                      <div className="bg-card/60 p-2 rounded-full mr-3">
                        <HardDrive className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{resource.title}</h4>
                        <p className="text-sm text-gray-400">{resource.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          {resource.file_type && <span>{resource.file_type}</span>}
                          {resource.file_size && (
                            <>
                              <span>•</span>
                              <span>{resource.file_size}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Updated: {new Date(resource.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Building Guidelines</CardTitle>
              <CardDescription>Policies and procedures for tenants and visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getItemsForCategory('guidelines').map((guide) => (
                  <div key={guide.id} className="space-y-2">
                    <h3 className="font-semibold text-white">{guide.title}</h3>
                    <p className="text-gray-400">{guide.content}</p>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfoHubPage;
