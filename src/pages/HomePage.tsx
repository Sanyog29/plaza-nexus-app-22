
import React from 'react';
import { MessageSquare, Calendar, Coffee, Bell, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import DashboardTile from '../components/DashboardTile';
import { Card, CardContent } from '@/components/ui/card';

const HomePage = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'Tenant';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Welcome to SS Plaza, {firstName}
        </h2>
        <p className="text-gray-400 text-sm">{currentDate}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <DashboardTile 
          title="Raise Request"
          description="Report issues or request services"
          icon={<MessageSquare size={24} className="text-white" />}
          to="/requests/new"
          bgColor="bg-gradient-to-br from-plaza-blue to-blue-700"
          count={0}
        />
        
        <DashboardTile 
          title="Book Room"
          description="Reserve meeting spaces"
          icon={<Calendar size={24} className="text-white" />}
          to="/bookings"
          bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
          count={2}
        />
        
        <DashboardTile 
          title="Cafeteria"
          description="View today's menu"
          icon={<Coffee size={24} className="text-white" />}
          to="/cafeteria"
          bgColor="bg-gradient-to-br from-amber-600 to-amber-800"
        />
        
        <DashboardTile 
          title="Alerts"
          description="Facility updates"
          icon={<Bell size={24} className="text-white" />}
          to="/alerts"
          bgColor="bg-gradient-to-br from-red-600 to-red-800"
          count={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Quick Status</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-full">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">All Systems</p>
                  <p className="text-xs text-green-500">Operating normally</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <AlertTriangle size={20} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Maintenance</p>
                  <p className="text-xs text-yellow-500">Scheduled today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Building Info</h3>
          <a href="/info-hub" className="text-plaza-blue text-sm">View All</a>
        </div>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-plaza-blue/20 p-2 rounded-lg mr-4">
                <FileText size={24} className="text-plaza-blue" />
              </div>
              <div>
                <h4 className="font-medium text-white">SS Plaza Directory</h4>
                <p className="text-sm text-gray-400">Floor plans & emergency contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
