import React from 'react';
import { 
  MessageSquare, 
  Calendar, 
  Coffee, 
  Bell, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Thermometer,
  Shield
} from 'lucide-react';
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
          description="Report issues or request assistance"
          icon={<MessageSquare size={24} className="text-white" />}
          to="/requests/new"
          bgColor="bg-gradient-to-br from-plaza-blue to-blue-700"
          count={3}
          status={{
            text: "2 Active",
            color: "bg-blue-500/20 text-blue-200"
          }}
        />
        
        <DashboardTile 
          title="Book Room"
          description="Reserve meeting spaces & training rooms"
          icon={<Calendar size={24} className="text-white" />}
          to="/bookings"
          bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
          count={2}
          status={{
            text: "3 Available",
            color: "bg-purple-400/20 text-purple-200"
          }}
        />
        
        <DashboardTile 
          title="Today's Menu"
          description="View cafeteria specials & pre-order"
          icon={<Coffee size={24} className="text-white" />}
          to="/cafeteria"
          bgColor="bg-gradient-to-br from-amber-600 to-amber-800"
          status={{
            text: "Lunch Active",
            color: "bg-amber-400/20 text-amber-200"
          }}
        />
        
        <DashboardTile 
          title="Alerts"
          description="Important facility updates"
          icon={<Bell size={24} className="text-white" />}
          to="/alerts"
          bgColor="bg-gradient-to-br from-red-600 to-red-800"
          count={3}
          status={{
            text: "1 Critical",
            color: "bg-red-400/20 text-red-200"
          }}
        />
        
        <DashboardTile 
          title="Security"
          description="Manage visitors & access control"
          icon={<Shield size={24} className="text-white" />}
          to="/security"
          bgColor="bg-gradient-to-br from-indigo-600 to-indigo-800"
          count={5}
          status={{
            text: "3 Pending",
            color: "bg-indigo-400/20 text-indigo-200"
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Quick Status</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
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

          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
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
          
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <Users size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Occupancy</p>
                  <p className="text-xs text-blue-500">82% (3,280 people)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <Thermometer size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Temperature</p>
                  <p className="text-xs text-emerald-500">24°C (Optimal)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Building Info</h3>
          <a href="/info-hub" className="text-plaza-blue text-sm hover:underline">View All</a>
        </div>
        
        <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-plaza-blue/20 p-2 rounded-lg mr-4">
                <FileText size={24} className="text-plaza-blue" />
              </div>
              <div>
                <h4 className="font-medium text-white">SS Plaza Directory</h4>
                <p className="text-sm text-gray-400">Floor plans, emergency contacts & guidelines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
