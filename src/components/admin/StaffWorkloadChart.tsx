
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock data for staff workload
// In a real application, this would come from the database
const mockStaffWorkloadData = [
  { department: 'Housekeeping', staffPresent: 8, openTickets: 12, resolvedToday: 15 },
  { department: 'Security', staffPresent: 6, openTickets: 5, resolvedToday: 8 },
  { department: 'Maintenance', staffPresent: 4, openTickets: 9, resolvedToday: 7 },
  { department: 'IT Support', staffPresent: 3, openTickets: 7, resolvedToday: 5 },
  { department: 'Reception', staffPresent: 2, openTickets: 3, resolvedToday: 6 },
];

const StaffWorkloadChart = () => {
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['staff-workload'],
    queryFn: async () => {
      try {
        // In a real application, fetch actual data from Supabase
        // For this demo, we'll use mockStaffWorkloadData
        return mockStaffWorkloadData;
      } catch (error) {
        toast({
          title: "Error loading staff workload data",
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
            <p className="text-gray-400">Loading staff workload data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Staff Attendance vs. Workload</CardTitle>
        <CardDescription>Staff capacity and ticket distribution by department</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                type="category" 
                dataKey="department" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                labelStyle={{ color: '#111' }}
                contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="staffPresent" name="Staff Present" fill="#10B981" />
              <Bar dataKey="openTickets" name="Open Tickets" fill="#EF4444" />
              <Bar dataKey="resolvedToday" name="Resolved Today" fill="#1E40AF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {workloadData?.map((item) => (
            <div key={item.department} className="text-xs text-gray-400">
              <p className="font-semibold text-white text-sm">{item.department}</p>
              <p>Tickets per Staff: {(item.openTickets / item.staffPresent).toFixed(1)}</p>
              <p>Efficiency: {(item.resolvedToday / item.staffPresent).toFixed(1)} tickets/staff</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffWorkloadChart;
