import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StaffManagementTabs } from '@/components/staff/StaffManagementTabs';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { SystemHealthWidget } from '@/components/common/SystemHealthWidget';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { 
  BarChart3, 
  Users, 
  AlertCircle, 
  Settings, 
  Activity, 
  TrendingUp,
  Shield,
  FileText,
  Database,
  Monitor,
  UserCheck,
  Zap,
  Clock,
  ChevronRight,
  Star,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  const featuredTools = [
    {
      title: "System Health",
      description: "Monitor system performance and health metrics",
      icon: Monitor,
      route: "/admin/system-health",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      badge: "Real-time"
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: UserCheck,
      route: "/admin/users",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge: "Enhanced"
    },
    {
      title: "Analytics Dashboard",
      description: "Advanced analytics and reporting tools",
      icon: BarChart3,
      route: "/admin/analytics",
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      badge: "New"
    },
    {
      title: "System Monitoring",
      description: "Real-time system monitoring and alerts",
      icon: Activity,
      route: "/admin/system-monitoring",
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      badge: "Live"
    },
    {
      title: "Security Settings",
      description: "Configure security policies and controls",
      icon: Shield,
      route: "/admin/settings?tab=security",
      color: "bg-gradient-to-br from-red-500 to-pink-600",
      badge: "Critical"
    },
    {
      title: "Audit Logs",
      description: "View system audit logs and user activity",
      icon: FileText,
      route: "/admin/audit-logs",
      color: "bg-gradient-to-br from-gray-500 to-slate-600",
      badge: "Compliance"
    }
  ];

  const quickStats = [
    { label: "Active Users", value: "284", change: "+12%", positive: true },
    { label: "System Uptime", value: "99.8%", change: "+0.2%", positive: true },
    { label: "Pending Tasks", value: "23", change: "-8%", positive: true },
    { label: "Response Time", value: "120ms", change: "-15ms", positive: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete system overview and management tools</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <TrendingUp className={`h-4 w-4 ${stat.positive ? 'text-green-500' : 'text-red-500'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* What's New Section */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle>What's New</CardTitle>
                <Badge variant="secondary">Updated</Badge>
              </div>
              <CardDescription>
                Latest features and improvements available in your admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredTools.map((tool, index) => (
                  <div 
                    key={index}
                    onClick={() => navigate(tool.route)}
                    className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className={`${tool.color} p-6 text-white relative`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <tool.icon className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary" className="bg-white/90 text-black text-xs">
                            {tool.badge}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
                        <p className="text-white/90 text-sm mb-3">{tool.description}</p>
                        <div className="flex items-center text-sm font-medium">
                          <span>Explore</span>
                          <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Widget */}
          <QuickActionsWidget />

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">System Health</TabsTrigger>
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Overview
                    </CardTitle>
                    <CardDescription>
                      Real-time facility management metrics and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-card/30 rounded-lg">
                        <h3 className="font-semibold text-lg">24</h3>
                        <p className="text-sm text-muted-foreground">Active Requests</p>
                      </div>
                      <div className="text-center p-4 bg-card/30 rounded-lg">
                        <h3 className="font-semibold text-lg">12</h3>
                        <p className="text-sm text-muted-foreground">Staff on Duty</p>
                      </div>
                      <div className="text-center p-4 bg-card/30 rounded-lg">
                        <h3 className="font-semibold text-lg">98.5%</h3>
                        <p className="text-sm text-muted-foreground">System Uptime</p>
                      </div>
                      <div className="text-center p-4 bg-card/30 rounded-lg">
                        <h3 className="font-semibold text-lg">Fast</h3>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin/users')}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin/system-health')}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System Health
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin/settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin/audit-logs')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Audit Logs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <SystemHealthWidget variant="detailed" showTraining={true} />
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <StaffManagementTabs />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure system preferences and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => navigate('/admin/settings?tab=general')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">General Settings</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Basic system configuration
                      </span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => navigate('/admin/settings?tab=security')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Security Settings</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Security policies and controls
                      </span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => navigate('/admin/settings?tab=departments')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Department Settings</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Manage departments and teams
                      </span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => navigate('/admin/settings?tab=integrations')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4" />
                        <span className="font-medium">Integrations</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        External system integrations
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}