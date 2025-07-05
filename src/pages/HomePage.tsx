import React from 'react';
import { 
  MessageSquare, 
  Calendar, 
  Coffee, 
  Bell, 
  FileText,
  Shield,
  Users,
  Building,
  Wrench,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Thermometer,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import DashboardTile from '../components/DashboardTile';
import { Card, CardContent } from '@/components/ui/card';
import AISummaryCards from '../components/AISummaryCards';

const HomePage = () => {
  const { user } = useAuth();
  const { metrics, isLoading } = useDashboardMetrics();
  const firstName = user?.user_metadata?.first_name || 'Tenant';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Welcome to SS Plaza, {firstName}
        </h2>
        <p className="text-gray-400">{currentDate}</p>
      </div>

      <AISummaryCards />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardTile 
          title="Raise Request"
          description="Report issues or request assistance"
          icon={<MessageSquare size={28} className="text-white" strokeWidth={1.5} />}
          to="/requests/new"
          bgColor="bg-gradient-to-br from-plaza-blue to-blue-700"
          count={metrics.totalRequests}
          status={{
            text: `${metrics.activeRequests} Active`,
            color: "bg-blue-500/20 text-blue-200"
          }}
        />
        
        <DashboardTile 
          title="Book Room"
          description="Reserve meeting spaces & training rooms"
          icon={<Calendar size={28} className="text-white" strokeWidth={1.5} />}
          to="/bookings"
          bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
          count={metrics.totalRooms}
          status={{
            text: `${metrics.availableRooms} Available`,
            color: "bg-purple-400/20 text-purple-200"
          }}
        />
        
        <DashboardTile 
          title="Today's Menu"
          description="View cafeteria specials & pre-order"
          icon={<Coffee size={28} className="text-white" strokeWidth={1.5} />}
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
          icon={<Bell size={28} className="text-white" strokeWidth={1.5} />}
          to="/alerts"
          bgColor="bg-gradient-to-br from-red-600 to-red-800"
          count={metrics.activeAlerts}
          status={{
            text: `${metrics.criticalAlerts} Critical`,
            color: "bg-red-400/20 text-red-200"
          }}
        />
        
        <DashboardTile 
          title="Security"
          description="Manage visitors & access control"
          icon={<Shield size={28} className="text-white" strokeWidth={1.5} />}
          to="/security"
          bgColor="bg-gradient-to-br from-indigo-600 to-indigo-800"
          count={metrics.totalVisitors}
          status={{
            text: `${metrics.pendingVisitors} Pending`,
            color: "bg-indigo-400/20 text-indigo-200"
          }}
        />
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-white">Quick Status</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${metrics.operationalSystems ? 'bg-green-500/20' : 'bg-red-500/20'} p-2 rounded-full`}>
                  {metrics.operationalSystems ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={20} className="text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">All Systems</p>
                  <p className={`text-xs ${metrics.operationalSystems ? 'text-green-500' : 'text-red-500'}`}>
                    {metrics.operationalSystems ? 'Operating normally' : 'Issues detected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${metrics.pendingMaintenance > 0 ? 'bg-yellow-500/20' : 'bg-green-500/20'} p-2 rounded-full`}>
                  {metrics.pendingMaintenance > 0 ? (
                    <AlertTriangle size={20} className="text-yellow-500" />
                  ) : (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Maintenance</p>
                  <p className={`text-xs ${metrics.pendingMaintenance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {metrics.pendingMaintenance > 0 ? `${metrics.pendingMaintenance} pending` : 'All up to date'}
                  </p>
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
                  <p className="text-xs text-blue-500">{metrics.occupancyRate}% ({metrics.totalOccupants.toLocaleString()} people)</p>
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
                  <p className="text-xs text-emerald-500">
                    {metrics.currentTemperature}°C {metrics.currentTemperature >= 22 && metrics.currentTemperature <= 26 ? '(Optimal)' : '(Adjusting)'}
                  </p>
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
