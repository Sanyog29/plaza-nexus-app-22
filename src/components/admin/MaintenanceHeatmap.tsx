
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock data for maintenance request distribution by location
// In a real application, this would come from the database
const mockHeatmapData = {
  'Floor 1': { 'Zone A': 12, 'Zone B': 5, 'Zone C': 2, 'Zone D': 8 },
  'Floor 2': { 'Zone A': 7, 'Zone B': 15, 'Zone C': 3, 'Zone D': 4 },
  'Floor 3': { 'Zone A': 3, 'Zone B': 6, 'Zone C': 18, 'Zone D': 2 },
  'Floor 4': { 'Zone A': 5, 'Zone B': 4, 'Zone C': 7, 'Zone D': 11 },
};

const MaintenanceHeatmap = () => {
  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ['maintenance-heatmap'],
    queryFn: async () => {
      try {
        // In a real application, fetch actual data from Supabase
        // For this demo, we'll use mockHeatmapData
        return mockHeatmapData;
      } catch (error) {
        toast({
          title: "Error loading heatmap data",
          description: "Please try again later",
          variant: "destructive",
        });
        return {};
      }
    }
  });

  const getColorIntensity = (value: number) => {
    // Max value in our dataset
    const maxValue = 18;
    const percentage = Math.min((value / maxValue) * 100, 100);
    return percentage;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading heatmap data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">Maintenance Request Heatmap</CardTitle>
        <CardDescription>Distribution of requests by location</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {heatmapData && Object.entries(heatmapData).map(([floor, zones]) => (
            <div key={floor} className="mb-4">
              <div className="text-sm font-medium text-foreground mb-2">{floor}</div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(zones as Record<string, number>).map(([zone, count]) => (
                  <div 
                    key={`${floor}-${zone}`} 
                    className="rounded p-3 text-center relative overflow-hidden"
                    style={{
                      backgroundColor: `rgba(30, 64, 175, ${getColorIntensity(count) / 100})`
                    }}
                  >
                    <span className="block text-xs text-primary-foreground/70 mb-1">{zone}</span>
                    <span className="text-primary-foreground font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-xs text-muted-foreground">Lower</div>
          <div className="h-2 w-full mx-2 rounded-full bg-gradient-to-r from-blue-900/20 to-blue-600"></div>
          <div className="text-xs text-muted-foreground">Higher</div>
        </div>
        <div className="text-center mt-2 text-xs text-muted-foreground">Complaint Density</div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceHeatmap;
