
import { Car, Coffee, ShoppingBag, Stethoscope, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceCard from './ServiceCard';
import { servicesData } from '@/data/services';

const ServicesTabs = ({ onSelectService }: { onSelectService: (service: any) => void }) => {
  return (
    <Tabs defaultValue="transport" className="w-full">
      <TabsList className="grid grid-cols-4 mb-6 bg-card/50">
        <TabsTrigger value="transport" className="data-[state=active]:bg-plaza-blue">
          <Car className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline-block">Transport</span>
        </TabsTrigger>
        <TabsTrigger value="cleaning" className="data-[state=active]:bg-plaza-blue">
          <ShoppingBag className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline-block">Cleaning</span>
        </TabsTrigger>
        <TabsTrigger value="food" className="data-[state=active]:bg-plaza-blue">
          <Coffee className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline-block">Food</span>
        </TabsTrigger>
        <TabsTrigger value="health" className="data-[state=active]:bg-plaza-blue">
          <Stethoscope className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline-block">Health</span>
        </TabsTrigger>
      </TabsList>

      {Object.entries(servicesData).map(([category, categoryServices]) => (
        <TabsContent key={category} value={category} className="space-y-4">
          {categoryServices.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              icon={getCategoryIcon(service.category)}
              onSelect={() => onSelectService(service)}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'transport':
      return <Car className="h-5 w-5" />;
    case 'cleaning':
      return <ShoppingBag className="h-5 w-5" />;
    case 'food':
      return <Coffee className="h-5 w-5" />;
    case 'health':
      return <Stethoscope className="h-5 w-5" />;
    default:
      return <Star className="h-5 w-5" />;
  }
};

export default ServicesTabs;
