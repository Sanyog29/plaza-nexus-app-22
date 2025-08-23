
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Simulate equipment maintenance cost data
// In a real application, this would come from the database
const mockEquipmentCostData = [
  { name: 'HVAC System', cost: 12500, repairs: 5 },
  { name: 'Backup Generator', cost: 8700, repairs: 3 },
  { name: 'UPS Systems', cost: 6300, repairs: 7 },
  { name: 'Elevators', cost: 15200, repairs: 4 },
  { name: 'Water Pumps', cost: 4200, repairs: 6 },
  { name: 'Fire Systems', cost: 7800, repairs: 2 },
  { name: 'Security Cameras', cost: 3500, repairs: 8 }
];

const EquipmentCostChart = () => {
  const { data: maintenanceCostData, isLoading } = useQuery({
    queryKey: ['equipment-maintenance-costs'],
    queryFn: async () => {
      try {
        // In a real application, fetch actual data from Supabase
        // For this demo, we'll use mockEquipmentCostData
        return mockEquipmentCostData;
      } catch (error) {
        toast({
          title: "Error loading equipment cost data",
          description: "Please try again later",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-400">Loading maintenance cost data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-card-foreground text-lg">Equipment Maintenance Cost</CardTitle>
        <CardDescription>Monthly maintenance expenditure by equipment type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceCostData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `₹${value/1000}k`}
              />
              <Tooltip 
                formatter={(value) => [`₹${value}`, 'Maintenance Cost']}
                labelStyle={{ color: '#111' }}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
              />
              <Bar dataKey="cost" fill="#1E40AF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-400">
            <strong>Total Monthly Expenditure:</strong> ₹{maintenanceCostData?.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">
            <strong>Highest Cost Item:</strong> {maintenanceCostData?.sort((a, b) => b.cost - a.cost)[0]?.name}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentCostChart;
