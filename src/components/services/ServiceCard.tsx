
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: string;
    rating: number;
    image: string;
    availability: string;
    category: string;
  };
  icon: React.ReactNode;
  onSelect: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, icon, onSelect }) => {
  return (
    <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="bg-card/60 p-2 rounded-full mr-3">
              {icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-white">{service.title}</h4>
              <p className="text-sm text-gray-400">{service.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{service.price}</span>
                <div className="flex items-center">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-gray-400 ml-1">{service.rating}</span>
                </div>
              </div>
              <p className="text-xs text-green-500">{service.availability}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-plaza-blue hover:bg-blue-700"
            onClick={onSelect}
          >
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
