
import React, { useState, useEffect } from 'react';
import { Car, Coffee, ShoppingBag, Stethoscope, Star, Wrench, Truck, Shield, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceCard from './ServiceCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_available: boolean;
  image_url: string | null;
}

const ServicesTabs = ({ onSelectService }: { onSelectService: (service: any) => void }) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServicesData();
  }, []);

  const fetchServicesData = async () => {
    try {
      const [categoriesResult, servicesResult] = await Promise.all([
        supabase.from('service_categories').select('*').eq('is_active', true).order('name'),
        supabase.from('service_items').select('*').eq('is_available', true).order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setCategories(categoriesResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading services",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getServicesForCategory = (categoryId: string) => {
    return services.filter(service => service.category_id === categoryId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue={categories[0]?.id} className="w-full">
      <TabsList className="grid w-full mb-6 bg-card/50" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:bg-plaza-blue">
            {getCategoryIcon(category.icon)}
            <span className="hidden sm:inline-block ml-1">{category.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="space-y-4">
          {getServicesForCategory(category.id).map((service) => (
            <ServiceCard 
              key={service.id}
              service={{
                id: service.id,
                title: service.name,
                description: service.description,
                price: `₹${service.price}`,
                rating: 4.5, // Default rating
                image: service.image_url || '/placeholder.svg',
                availability: `${service.duration_minutes} minutes`,
                category: category.name.toLowerCase()
              }}
              icon={getCategoryIcon(category.icon)}
              onSelect={() => onSelectService({
                ...service,
                title: service.name,
                categoryName: category.name
              })}
            />
          ))}
          {getServicesForCategory(category.id).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No services available in this category
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

const getCategoryIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'truck':
      return <Truck className="h-4 w-4" />;
    case 'sparkles':
      return <Sparkles className="h-4 w-4" />;
    case 'wrench':
      return <Wrench className="h-4 w-4" />;
    case 'shield':
      return <Shield className="h-4 w-4" />;
    case 'car':
      return <Car className="h-4 w-4" />;
    case 'coffee':
      return <Coffee className="h-4 w-4" />;
    case 'shoppingbag':
      return <ShoppingBag className="h-4 w-4" />;
    case 'stethoscope':
      return <Stethoscope className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
};

export default ServicesTabs;
