
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardStatProps {
  tickets: any[];
  staff: any[];
  equipment: any[];
  slaCompliance: any[];
}

const DashboardStats = ({ tickets, staff, equipment, slaCompliance }: DashboardStatProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-4xl font-bold text-white">{tickets.filter(t => t.status !== 'completed').length}</span>
            <span className="text-sm text-gray-400 mt-1">Active Tickets</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-4xl font-bold text-white">{staff.filter(s => s.attendance === 'present').length}</span>
            <span className="text-sm text-gray-400 mt-1">Staff Present</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-4xl font-bold text-white">{equipment.filter(e => e.status === 'operational').length}/{equipment.length}</span>
            <span className="text-sm text-gray-400 mt-1">Systems Operational</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-4xl font-bold text-white">96%</span>
            <span className="text-sm text-gray-400 mt-1">SLA Compliance</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
