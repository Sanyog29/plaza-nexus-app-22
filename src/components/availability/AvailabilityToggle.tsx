import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Clock } from 'lucide-react';

interface AvailabilityStatus {
  is_available: boolean;
  availability_status: string;
  last_status_change: string;
  auto_offline_at?: string;
}

const AvailabilityToggle = () => {
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoOfflineMinutes, setAutoOfflineMinutes] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching availability:', error);
        return;
      }

      setAvailability(data || {
        is_available: true,
        availability_status: 'available',
        last_status_change: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateAvailability = async (status: string, autoOffline?: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_staff_availability', {
        new_status: status,
        auto_offline_minutes: autoOffline || null
      });

      if (error) throw error;

      await fetchAvailability();
      
      toast({
        title: 'Availability Updated',
        description: `Status changed to ${status}${autoOffline ? ` with auto-offline in ${autoOffline} minutes` : ''}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      case 'on_leave':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      case 'on_leave':
        return 'On Leave';
      default:
        return status;
    }
  };

  if (!availability) {
    return <div className="animate-pulse bg-muted h-10 w-32 rounded"></div>;
  }

  return (
    <div className="flex items-center gap-4">
      {/* Status Badge */}
      <Badge 
        variant="outline" 
        className={`${getStatusColor(availability.availability_status)} text-white border-0`}
      >
        {formatStatus(availability.availability_status)}
      </Badge>

      {/* Status Select */}
      <Select
        value={availability.availability_status}
        onValueChange={(value) => updateAvailability(value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="busy">Busy</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="on_leave">On Leave</SelectItem>
        </SelectContent>
      </Select>

      {/* Auto-offline for Available status */}
      {availability.availability_status === 'available' && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={autoOfflineMinutes}
            onValueChange={(value) => {
              setAutoOfflineMinutes(value);
              if (value) {
                updateAvailability('available', parseInt(value));
              }
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Manual</SelectItem>
              <SelectItem value="30">30m</SelectItem>
              <SelectItem value="60">1h</SelectItem>
              <SelectItem value="120">2h</SelectItem>
              <SelectItem value="240">4h</SelectItem>
              <SelectItem value="480">8h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Auto-offline warning */}
      {availability.auto_offline_at && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>
            Auto-offline: {new Date(availability.auto_offline_at).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default AvailabilityToggle;