
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PerformanceChartProps {
  data: any[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Performance Overview</CardTitle>
        <CardDescription>Monthly request handling performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="totalRequests" stroke="#1E40AF" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="breached" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-800 rounded-full mr-2" />
            <span className="text-sm text-gray-400">Total Requests</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-2" />
            <span className="text-sm text-gray-400">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
            <span className="text-sm text-gray-400">SLA Breached</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
