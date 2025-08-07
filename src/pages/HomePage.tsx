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
  Loader2,
  Clock,
  Star,
  CreditCard,
  UserCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardTile from '../components/DashboardTile';
import { Card, CardContent } from '@/components/ui/card';
import AISummaryCards from '../components/AISummaryCards';
import { VisitorNotificationBanner } from '@/components/notifications/VisitorNotificationBanner';
import { SystemHealthWidget } from '@/components/common/SystemHealthWidget';

const HomePage = () => {
  const { user } = useAuth();
  const { metrics: oldMetrics, isLoading: oldLoading } = useDashboardMetrics();
  const { metrics: newMetrics, isLoading: newLoading } = useDashboardData();
  const firstName = user?.user_metadata?.first_name || 'Tenant';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Show loading state
  if (oldLoading || newLoading) {
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

      <VisitorNotificationBanner />
      
      {/* Core Operations - Priority Features */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">Core Operations</h3>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Activity size={16} />
            <span>Live System</span>
          </div>
        </div>
        
        {/* Primary Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardTile 
            title="Helpdesk & Ticketing"
            description="Report issues, track requests & get support"
            icon={<MessageSquare size={28} className="text-white" strokeWidth={1.5} />}
            to="/requests/new"
            bgColor="bg-gradient-to-br from-plaza-blue to-blue-700"
            count={newMetrics.totalRequests}
            status={{
              text: `${newMetrics.pendingRequests} Active Tickets`,
              color: "bg-blue-500/20 text-blue-200"
            }}
          />
          
          <DashboardTile 
            title="Visitor Management"
            description="Check-in visitors & manage access control"
            icon={<UserCheck size={28} className="text-white" strokeWidth={1.5} />}
            to="/security"
            bgColor="bg-gradient-to-br from-indigo-600 to-indigo-800"
            count={newMetrics.totalVisitors}
            status={{
              text: `${newMetrics.activeVisitors} Active Visitors`,
              color: "bg-indigo-400/20 text-indigo-200"
            }}
          />
          
          <DashboardTile 
            title="Room Bookings"
            description="Reserve meeting spaces & conference rooms"
            icon={<Calendar size={28} className="text-white" strokeWidth={1.5} />}
            to="/bookings"
            bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
            count={newMetrics.upcomingBookings}
            status={{
              text: `Available Today`,
              color: "bg-purple-400/20 text-purple-200"
            }}
          />
        </div>
        
        {/* Secondary Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardTile 
            title="Cafe & Loyalty"
            description="Order via app • Earn points • Pay via UPI"
            icon={<Coffee size={28} className="text-white" strokeWidth={1.5} />}
            to="/cafeteria"
            bgColor="bg-gradient-to-br from-amber-600 to-amber-800"
            status={{
              text: "Order & Earn Points",
              color: "bg-amber-400/20 text-amber-200"
            }}
          />
          
          <DashboardTile 
            title="Critical Alerts"
            description="Important facility updates & notifications"
            icon={<Bell size={28} className="text-white" strokeWidth={1.5} />}
            to="/alerts"
            bgColor="bg-gradient-to-br from-red-600 to-red-800"
            count={newMetrics.systemAlerts}
            status={{
              text: `${newMetrics.systemAlerts > 0 ? 'Require Attention' : 'All Clear'}`,
              color: "bg-red-400/20 text-red-200"
            }}
          />
        </div>
      </div>

      {/* Quick Stats & Cafe Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cafe Loyalty Section */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Star size={24} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Loyalty Points</h4>
                  <p className="text-sm text-amber-300">Earn with every order</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-400">1,250</p>
                <p className="text-xs text-amber-300">Available</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <CreditCard size={16} />
              <span>UPI Payment Available</span>
            </div>
          </CardContent>
        </Card>

        {/* Building Metrics */}
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Building Occupancy</p>
                  <p className="text-sm text-blue-400">{oldMetrics.occupancyRate}% • {oldMetrics.totalOccupants.toLocaleString()} people</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Thermometer size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Climate Control</p>
                  <p className="text-sm text-emerald-400">
                    {oldMetrics.currentTemperature}°C • {oldMetrics.currentTemperature >= 22 && oldMetrics.currentTemperature <= 26 ? 'Optimal' : 'Adjusting'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">System Health</h4>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Request Response</span>
                  <span className="text-sm text-emerald-400">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">System Uptime</span>
                  <span className="text-sm text-emerald-400">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">User Satisfaction</span>
                  <span className="text-sm text-emerald-400">4.8/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Building Info & Quick Access */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Building Information</h3>
          <Link to="/info-hub" className="text-plaza-blue text-sm hover:underline flex items-center gap-1">
            <FileText size={14} />
            View Directory
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-plaza-blue/20 p-2 rounded-lg">
                  <Building size={24} className="text-plaza-blue" />
                </div>
                <div>
                  <h4 className="font-medium text-white">SS Plaza Directory</h4>
                  <p className="text-sm text-gray-400">Floor plans • Emergency contacts • Guidelines</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Shield size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Safety & Security</h4>
                  <p className="text-sm text-gray-400">Emergency procedures • Safety protocols</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
