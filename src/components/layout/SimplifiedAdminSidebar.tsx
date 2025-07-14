import React from 'react';
import { 
  Home,
  Users,
  BarChart3,
  Settings,
  ClipboardList,
  Building,
  Wrench,
  Shield,
  User,
  HelpCircle,
  Search,
  Zap
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

// Simplified menu structure - 4 main categories instead of 6+
const adminMenuGroups = [
  {
    label: "Daily Operations",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      { title: "Requests", url: "/admin/requests", icon: ClipboardList },
      { title: "Quick Actions", url: "/admin/quick-actions", icon: Zap },
    ]
  },
  {
    label: "Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Assets", url: "/admin/assets", icon: Building },
      { title: "Services", url: "/admin/services", icon: Wrench },
      { title: "Security", url: "/admin/security", icon: Shield },
    ]
  },
  {
    label: "Analytics",
    items: [
      { title: "Insights Hub", url: "/admin/analytics", icon: BarChart3 },
      { title: "Search", url: "/admin/search", icon: Search },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Configuration", url: "/admin/settings", icon: Settings },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
    ]
  }
];

const staffMenuGroups = [
  {
    label: "Daily Operations", 
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Tasks", url: "/staff/tasks", icon: ClipboardList },
      { title: "Quick Actions", url: "/staff/quick-actions", icon: Zap },
    ]
  },
  {
    label: "Work Management",
    items: [
      { title: "Requests", url: "/staff/requests", icon: Wrench },
      { title: "Maintenance", url: "/staff/maintenance", icon: Building },
    ]
  },
  {
    label: "Performance",
    items: [
      { title: "My Analytics", url: "/staff/analytics", icon: BarChart3 },
      { title: "Search", url: "/staff/search", icon: Search },
    ]
  },
  {
    label: "Personal",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
    ]
  }
];

const tenantMenuGroups = [
  {
    label: "Services",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "My Requests", url: "/requests", icon: ClipboardList },
      { title: "New Request", url: "/new-request", icon: Zap },
    ]
  },
  {
    label: "Facilities",
    items: [
      { title: "Room Bookings", url: "/bookings", icon: Building },
      { title: "Services", url: "/services", icon: Wrench },
    ]
  },
  {
    label: "Personal",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
    ]
  }
];

interface SimplifiedAdminSidebarProps {
  userRole: string;
}

export function SimplifiedAdminSidebar({ userRole }: SimplifiedAdminSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const getMenuGroups = () => {
    switch (userRole) {
      case 'admin':
      case 'ops_supervisor':
        return adminMenuGroups;
      case 'field_staff':
      case 'ops_l1':
      case 'ops_l2':
        return staffMenuGroups;
      default:
        return tenantMenuGroups;
    }
  };

  const menuGroups = getMenuGroups();
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isCollapsed = state === 'collapsed';

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-primary text-primary-foreground font-medium shadow-lg' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md'
    }`;
  };

  return (
    <Sidebar className="border-r border-border backdrop-blur-lg bg-card/50" collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-card/80 to-card/60">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-sm">SP</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">SS Plaza</h2>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole === 'admin' ? 'Admin' : 
                     userRole === 'ops_supervisor' ? 'Supervisor' :
                     userRole.includes('staff') ? 'Staff' :
                     'Tenant'} Portal
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={`${isCollapsed ? 'sr-only' : ''} text-primary font-medium`}>
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