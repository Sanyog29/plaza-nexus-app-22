import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TicketVolumeChartProps {
  data: Array<{
    date: string;
    created: number;
    resolved: number;
    open: number;
  }>;
  loading?: boolean;
}

export const TicketVolumeChart: React.FC<TicketVolumeChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Volume Trend</CardTitle>
        <CardDescription>Daily ticket creation, resolution, and open count</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Created"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="resolved" 
              stroke="hsl(var(--success))"
              strokeWidth={2}
              name="Resolved"
              dot={{ fill: 'hsl(var(--success))' }}
            />
            <Line 
              type="monotone" 
              dataKey="open" 
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              name="Open"
              dot={{ fill: 'hsl(var(--warning))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};