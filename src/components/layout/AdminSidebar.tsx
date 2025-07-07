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

// Enhanced Admin Menu Structure
const adminMenuGroups = [
  {
    label: "Core Operations",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      { title: "Requests", url: "/admin/requests", icon: ClipboardList },
      { title: "User Management", url: "/admin/users", icon: Users },
    ]
  },
  {
    label: "Content Management",
    items: [
      { title: "Content Manager", url: "/admin/content", icon: Edit },
      { title: "System Config", url: "/admin/system-config", icon: Settings },
    ]
  },
  {
    label: "Building Management", 
    items: [
      { title: "Maintenance", url: "/maintenance", icon: Wrench },
      { title: "Security & Visitors", url: "/security", icon: Shield },
      { title: "Services Hub", url: "/services", icon: Building },
    ]
  },
  {
    label: "Analytics & Insights",
    items: [
      { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
      { title: "System Health", url: "/unified-dashboard", icon: Activity },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText },
      { title: "Bulk Operations", url: "/admin/bulk-operations", icon: Calendar },
    ]
  },
  {
    label: "User",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// Simplified Staff Menu Structure  
const staffMenuGroups = [
  {
    label: "Daily Work",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Tasks", url: "/staff/operations", icon: ClipboardList },
      { title: "Performance", url: "/staff/performance", icon: Activity },
    ]
  },
  {
    label: "Building Operations",
    items: [
      { title: "Maintenance", url: "/maintenance", icon: Wrench },
      { title: "Security", url: "/security", icon: Shield },
      { title: "Services", url: "/services", icon: Building },
    ]
  },
  {
    label: "Reporting",
    items: [
      { title: "Analytics", url: "/staff/reports", icon: BarChart3 },
    ]
  },
  {
    label: "Personal", 
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Settings", url: "/staff/settings", icon: Settings },
    ]
  }
];

interface AdminSidebarProps {
  userRole: 'admin' | 'staff';
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuGroups = userRole === 'admin' ? adminMenuGroups : staffMenuGroups;
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

        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
              {group.label}
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
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
        ))}

      </SidebarContent>
    </Sidebar>
  );
}