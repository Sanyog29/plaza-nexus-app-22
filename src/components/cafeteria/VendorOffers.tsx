import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Clock, Tag } from 'lucide-react';

const VendorOffers: React.FC = () => {
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['vendor-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_offers')
        .select(`
          *,
          vendor:vendors(name, logo_url)
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Tag className="h-8 w-8 mx-auto mb-2" />
        <p>No active offers available</p>
      </div>
    );
  }

  const getDiscountDisplay = (offer: any) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% OFF`;
    } else if (offer.discount_type === 'fixed_amount') {
      return `₹${offer.discount_value} OFF`;
    } else {
      return 'BOGO';
    }
  };

  const getDaysLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">🎉 Active Offers</h3>
      
      <div className="space-y-3">
        {offers.map((offer) => (
          <Card key={offer.id} className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {offer.vendor?.logo_url && (
                    <img 
                      src={offer.vendor.logo_url} 
                      alt={offer.vendor.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <CardTitle className="text-sm text-white">{offer.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                  <Percent className="h-3 w-3 mr-1" />
                  {getDiscountDisplay(offer)}
                </Badge>
              </div>
              <CardDescription className="text-xs text-gray-400">
                by {offer.vendor?.name}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-gray-300 mb-2">{offer.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Code: {offer.offer_code}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{getDaysLeft(offer.end_date)} days left</span>
                </div>
              </div>
              
              {offer.minimum_order_amount && (
                <p className="text-xs text-gray-500 mt-1">
                  Min order: ₹{offer.minimum_order_amount}
                </p>
              )}
              
              {offer.usage_limit && offer.used_count && (
                <div className="mt-2">
                  <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((offer.used_count / offer.usage_limit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {offer.usage_limit - offer.used_count} uses remaining
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorOffers;