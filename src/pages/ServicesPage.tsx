
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Car, Coffee, Stethoscope, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceBookingModal from '@/components/services/ServiceBookingModal';

// Sample service data
const services = {
  transport: [
    {
      id: 'cab-1',
      title: 'Plaza Cabs',
      description: 'Book a cab for your daily commute or airport transfers',
      price: '₹200-1500',
      rating: 4.7,
      image: '/placeholder.svg',
      availability: 'Available now',
      category: 'transport'
    },
    {
      id: 'cab-2',
      title: 'Executive Car Service',
      description: 'Premium car service with professional drivers',
      price: '₹500-2000',
      rating: 4.8,
      image: '/placeholder.svg',
      availability: 'Available in 15 mins',
      category: 'transport'
    },
  ],
  cleaning: [
    {
      id: 'cleaning-1',
      title: 'Express Dry Clean',
      description: '24-hour turnaround for all your dry cleaning needs',
      price: '₹200+',
      rating: 4.5,
      image: '/placeholder.svg',
      availability: 'Drop off by 10 AM',
      category: 'cleaning'
    },
    {
      id: 'cleaning-2',
      title: 'Home Cleaning',
      description: 'Professional home cleaning services',
      price: '₹800+',
      rating: 4.6,
      image: '/placeholder.svg',
      availability: 'Book 24hrs in advance',
      category: 'cleaning'
    },
  ],
  food: [
    {
      id: 'food-1',
      title: 'Meal Pre-order',
      description: 'Pre-order your meals from the cafeteria',
      price: '₹150-400',
      rating: 4.3,
      image: '/placeholder.svg',
      availability: 'Order by 8 PM for next day',
      category: 'food'
    },
    {
      id: 'food-2',
      title: 'Special Diet Meals',
      description: 'Customized meals for special dietary requirements',
      price: '₹250-500',
      rating: 4.4,
      image: '/placeholder.svg',
      availability: '48hr advance booking',
      category: 'food'
    },
  ],
  health: [
    {
      id: 'health-1',
      title: 'Telemedicine Consult',
      description: 'Virtual consultation with healthcare professionals',
      price: '₹500-1500',
      rating: 4.8,
      image: '/placeholder.svg',
      availability: 'Same day appointments available',
      category: 'health'
    },
    {
      id: 'health-2',
      title: 'Pharmacy Delivery',
      description: 'Get medicines delivered to your apartment',
      price: 'Varies',
      rating: 4.7,
      image: '/placeholder.svg',
      availability: '2-4 hour delivery',
      category: 'health'
    },
  ],
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

const ServicesPage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Service Marketplace</h2>
        <p className="text-sm text-gray-400 mt-1">Book services available in SS Plaza</p>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-white">Recent Bookings</h3>
            <Button variant="link" className="text-plaza-blue p-0">View All</Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-md bg-card/60">
              <div className="flex items-center gap-3">
                <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full">
                  <Car size={18} className="text-plaza-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Plaza Cab</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <CalendarClock size={12} className="mr-1" />
                    <span>Today, 5:30 PM</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">Confirmed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services tabs */}
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
            <Medkit className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Health</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(services).map(([category, categoryServices]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {categoryServices.map((service) => (
              <ServiceCard 
                key={service.id}
                service={service}
                icon={getCategoryIcon(service.category)}
                onSelect={() => handleSelectService(service)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <ServiceBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesPage;
