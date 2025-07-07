import React from 'react';
import { 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  AlertTriangle,
  Home,
  Wrench,
  ClipboardList,
  TrendingUp,
  User,
  Activity,
  GraduationCap,
  Brain,
  Zap,
  Shield,
  Info,
  BookOpen,
  Calendar,
  ChefHat,
  Building,
  Layout,
  HelpCircle,
  Edit
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Unified Dashboard", url: "/unified-dashboard", icon: Layout },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "System Config", url: "/admin/system-config", icon: Settings },
  { title: "Bulk Operations", url: "/admin/bulk-operations", icon: Edit },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText },
  { title: "Requests", url: "/admin/requests", icon: ClipboardList },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Security Guard", url: "/security-guard", icon: Shield },
  { title: "Services", url: "/services", icon: Building },
  { title: "Bookings", url: "/bookings", icon: Calendar },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Cafeteria", url: "/cafeteria", icon: ChefHat },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Content", url: "/admin/content", icon: FileText },
  { title: "Info Hub", url: "/info-hub", icon: Info },
  { title: "User Manual", url: "/manual", icon: BookOpen },
  { title: "Operational Excellence", url: "/operational-excellence", icon: Brain },
  { title: "Advanced Features", url: "/advanced-features", icon: Zap },
];

const staffMenuItems = [
  { title: "Dashboard", url: "/staff/dashboard", icon: Home },
  { title: "Unified Dashboard", url: "/unified-dashboard", icon: Layout },
  { title: "Operations", url: "/staff/operations", icon: ClipboardList },
  { title: "Requests", url: "/staff/requests", icon: Wrench },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Security Guard", url: "/security-guard", icon: Shield },
  { title: "Services", url: "/services", icon: Building },
  { title: "Bookings", url: "/bookings", icon: Calendar },
  { title: "Alerts", url: "/staff/alerts", icon: AlertTriangle },
  { title: "Cafeteria", url: "/cafeteria", icon: ChefHat },
  { title: "Reports", url: "/staff/reports", icon: BarChart3 },
  { title: "Info Hub", url: "/info-hub", icon: Info },
  { title: "User Manual", url: "/manual", icon: BookOpen },
  { title: "Settings", url: "/staff/settings", icon: Settings },
  { title: "Performance", url: "/staff/performance", icon: Activity },
  { title: "Training", url: "/staff/training", icon: GraduationCap },
  { title: "Operational Excellence", url: "/operational-excellence", icon: Brain },
  { title: "Advanced Features", url: "/advanced-features", icon: Zap },
];

interface AdminSidebarProps {
  userRole: 'admin' | 'staff';
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = userRole === 'admin' ? adminMenuItems : staffMenuItems;
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isCollapsed = state === 'collapsed';

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      active 
        ? 'bg-primary text-primary-foreground font-medium' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;
  };

  return (
    <Sidebar className="border-r border-border" collapsible="icon">
      <SidebarContent className="bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SP</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">SS Plaza</h2>
                  <p className="text-xs text-muted-foreground capitalize">{userRole} Panel</p>
                </div>
              </>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            {userRole === 'admin' ? 'Administration' : 'Staff Tools'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile Access */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="space-y-2">
              <NavLink 
                to="/profile" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </NavLink>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}