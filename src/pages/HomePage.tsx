import React from "react";
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
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardTile from "../components/DashboardTile";
import { Card, CardContent } from "@/components/ui/card";
import AISummaryCards from "../components/AISummaryCards";
import { VisitorNotificationBanner } from "@/components/notifications/VisitorNotificationBanner";
import { SystemHealthWidget } from "@/components/common/SystemHealthWidget";
const HomePage = () => {
  const { user } = useAuth();
  const { metrics: oldMetrics, isLoading: oldLoading } = useDashboardMetrics();
  const { metrics: newMetrics, isLoading: newLoading } = useDashboardData();
  const firstName = user?.user_metadata?.first_name || "Employee";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Show loading state
  if (oldLoading || newLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to AUTOPILOT, {firstName}</h2>
        <p className="text-muted-foreground">{currentDate}</p>
      </div>

      <VisitorNotificationBanner />

      {/* Core Operations - Priority Features */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-foreground">Core Operations</h3>
          <div className="flex items-center gap-2 text-sm text-success">
            <Activity size={16} />
            <span>Live System</span>
          </div>
        </div>

        {/* Primary Action Grid - 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardTile
            title="Helpdesk & Ticketing"
            description="Report issues, track requests & get support"
            icon={<MessageSquare size={28} className="text-primary-foreground" strokeWidth={1.5} />}
            to="/requests/new"
            bgColor="bg-blue-600"
            count={newMetrics.totalRequests}
            status={{
              text: `${newMetrics.pendingRequests} Active Tickets`,
              color: "bg-background/20 text-primary-foreground",
            }}
          />

          <DashboardTile
            title="Visitor Management"
            description="Check-in visitors & manage access control"
            icon={<UserCheck size={28} className="text-primary-foreground" strokeWidth={1.5} />}
            to="/security"
            bgColor="bg-indigo-600"
            count={newMetrics.totalVisitors}
            status={{
              text: `${newMetrics.activeVisitors} Active Visitors`,
              color: "bg-background/20 text-primary-foreground",
            }}
          />

          <DashboardTile
            title="Room Bookings"
            description="Reserve meeting spaces & conference rooms"
            icon={<Calendar size={28} className="text-primary-foreground" strokeWidth={1.5} />}
            to="/bookings"
            bgColor="bg-purple-600"
            count={newMetrics.upcomingBookings}
            status={{
              text: `Available Today`,
              color: "bg-background/20 text-primary-foreground",
            }}
          />

          <DashboardTile
            title="Cafe & Loyalty"
            description="Order via app • Earn points • Pay via UPI"
            icon={<Coffee size={28} className="text-primary-foreground" strokeWidth={1.5} />}
            to="/cafeteria"
            bgColor="bg-amber-600"
            status={{
              text: "Order & Earn Points",
              color: "bg-background/20 text-primary-foreground",
            }}
          />
        </div>
      </div>

      {/* Quick Stats & Cafe Features */}

      {/* Building Info & Quick Access */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-foreground">Building Information</h3>
          <Link to="/info-hub" className="text-plaza-blue text-sm hover:underline flex items-center gap-1">
            <FileText size={14} />
            View Directory
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border hover:bg-accent transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 dark:bg-blue-700 p-2 rounded-lg">
                  <Building size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-foreground font-medium text-base text-left">AUTOPILOT Directory</h4>
                  <p className="text-sm text-muted-foreground">Floor plans • Emergency contacts • Guidelines</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border hover:bg-accent transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 dark:bg-emerald-700 p-2 rounded-lg">
                  <Shield size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-base text-left">Safety & Security</h4>
                  <p className="text-sm text-muted-foreground">Emergency procedures • Safety protocols</p>
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
