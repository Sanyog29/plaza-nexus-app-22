import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
  cuisine_type: string;
  average_rating: number;
  is_active: boolean;
  store_config?: {
    deliveryConfig?: {
      estimatedTime?: number;
      deliveryFee?: number;
      minimumOrder?: number;
    };
    operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
    storeDescription?: string;
  };
}

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (vendorId: string) => void;
}

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, onSelect }) => {
  const navigate = useNavigate();

  // Check if vendor is currently open
  const isOpen = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = vendor.store_config?.operatingHours?.[currentDay];
    if (!todayHours || todayHours.closed) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const handleViewMenu = () => {
    if (onSelect) {
      onSelect(vendor.id);
    } else {
      navigate(`/cafeteria/vendor/${vendor.id}`);
    }
  };

  const estimatedTime = vendor.store_config?.deliveryConfig?.estimatedTime || 30;
  const deliveryFee = vendor.store_config?.deliveryConfig?.deliveryFee || 0;
  const minimumOrder = vendor.store_config?.deliveryConfig?.minimumOrder || 0;
  const vendorOpen = isOpen();

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full flex flex-col touch-manipulation">
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Vendor Header */}
        <div className="flex items-start gap-3 flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {vendor.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={vendor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-xl sm:text-2xl font-bold">{vendor.name.charAt(0)}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base sm:text-lg truncate pr-2">{vendor.name}</h3>
              <Badge variant={vendorOpen ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {vendorOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{vendor.cuisine_type}</p>
            
            {vendor.store_config?.storeDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {vendor.store_config.storeDescription}
              </p>
            )}
          </div>
        </div>

        {/* Vendor Stats */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{vendor.average_rating > 0 ? vendor.average_rating.toFixed(1) : 'New'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{estimatedTime} mins</span>
          </div>
          
          {deliveryFee > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>₹{deliveryFee} delivery</span>
            </div>
          )}
        </div>

        {/* Order Info */}
        {minimumOrder > 0 && (
          <div className="text-xs text-muted-foreground">
            Min order: ₹{minimumOrder}
          </div>
        )}

        {/* Action Button - Auto-pushes to bottom */}
        <div className="mt-auto pt-2">
          <Button 
            onClick={handleViewMenu}
            disabled={!vendorOpen}
            className="w-full min-h-[44px] text-sm"
            size="sm"
          >
            {vendorOpen ? 'View Menu' : 'Currently Closed'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};