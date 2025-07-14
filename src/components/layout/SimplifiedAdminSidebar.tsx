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
  Zap,
  Calendar,
  Coffee,
  Package,
  FileText,
  ShoppingCart,
  Monitor,
  TrendingUp,
  Database,
  Cog,
  ChevronDown,
  ChevronRight,
  Bell,
  MapPin,
  Truck,
  Store,
  BookOpen,
  Archive,
  UserCheck,
  Lock,
  Activity
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Comprehensive menu structure with all features restored
const adminMenuGroups = [
  {
    label: "Daily Operations",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      { title: "Requests", url: "/admin/requests", icon: ClipboardList },
      { title: "Quick Actions", url: "/admin/quick-actions", icon: Zap },
      { title: "Alerts", url: "/alerts", icon: Bell },
    ]
  },
  {
    label: "User Management",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "New User", url: "/admin/users/new", icon: UserCheck },
      { title: "Performance", url: "/staff/performance", icon: TrendingUp },
      { title: "Training", url: "/staff/training", icon: BookOpen },
    ]
  },
  {
    label: "Facility Management",
    items: [
      { title: "Assets", url: "/admin/assets", icon: Building },
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Security", url: "/admin/security", icon: Shield },
      { title: "Bookings", url: "/bookings", icon: Calendar },
    ]
  },
  {
    label: "Services & Operations",
    items: [
      { title: "Services Marketplace", url: "/services", icon: Store },
      { title: "Cafeteria Management", url: "/admin/cafeteria", icon: Coffee },
      { title: "Delivery Management", url: "/delivery", icon: Truck },
      { title: "Vendor Portal", url: "/vendor-portal", icon: ShoppingCart },
    ]
  },
  {
    label: "Analytics & Reports",
    items: [
      { 
        title: "Advanced Analytics", 
        url: "/admin/analytics", 
        icon: BarChart3,
        subItems: [
          { title: "Operational Excellence", url: "/operational-excellence" },
          { title: "Advanced Features", url: "/advanced-features" },
          { title: "Reports", url: "/admin/reports" },
          { title: "Unified Dashboard", url: "/unified-dashboard" },
          { title: "Staff Analytics", url: "/staff/analytics" }
        ] as { title: string; url: string }[]
      },
      { title: "System Health", url: "/admin/system-health", icon: Activity },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: Archive },
      { title: "Search", url: "/admin/search", icon: Search },
    ]
  },
  {
    label: "System Management",
    items: [
      { title: "Content Management", url: "/admin/content", icon: FileText },
      { title: "System Config", url: "/admin/system-config", icon: Settings },
      { title: "Bulk Operations", url: "/admin/bulk-operations", icon: Database },
      { title: "Info Hub", url: "/info-hub", icon: MapPin },
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

const staffMenuGroups = [
  {
    label: "Daily Operations", 
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Tasks", url: "/staff/tasks", icon: ClipboardList },
      { title: "Quick Actions", url: "/staff/quick-actions", icon: Zap },
      { title: "Alerts", url: "/staff/alerts", icon: Bell },
    ]
  },
  {
    label: "Work Management",
    items: [
      { title: "Requests", url: "/staff/requests", icon: Wrench },
      { title: "Maintenance", url: "/staff/maintenance", icon: Building },
      { title: "Security Tasks", url: "/staff/security", icon: Shield },
      { title: "Services", url: "/staff/services", icon: Store },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Operations Center", url: "/staff/operations", icon: Monitor },
      { title: "Security Guard", url: "/security-guard", icon: Lock },
      { title: "Schedule", url: "/staff/schedule", icon: Calendar },
    ]
  },
  {
    label: "Performance & Learning",
    items: [
      { title: "My Analytics", url: "/staff/analytics", icon: BarChart3 },
      { title: "Performance", url: "/staff/performance", icon: TrendingUp },
      { title: "Training", url: "/staff/training", icon: BookOpen },
      { title: "Reports", url: "/staff/reports", icon: FileText },
    ]
  },
  {
    label: "Tools",
    items: [
      { title: "Search", url: "/staff/search", icon: Search },
      { title: "Settings", url: "/staff/settings", icon: Cog },
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
      { title: "Alerts", url: "/alerts", icon: Bell },
    ]
  },
  {
    label: "Facilities & Services",
    items: [
      { title: "Room Bookings", url: "/bookings", icon: Calendar },
      { title: "Services Marketplace", url: "/services", icon: Store },
      { title: "Cafeteria", url: "/cafeteria", icon: Coffee },
      { title: "Delivery Tracking", url: "/delivery", icon: Truck },
    ]
  },
  {
    label: "Information",
    items: [
      { title: "Info Hub", url: "/info-hub", icon: MapPin },
      { title: "Security", url: "/security", icon: Shield },
      { title: "Maintenance", url: "/maintenance", icon: Wrench },
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
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

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

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
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
                 {group.items.map((item: any) => (
                   <SidebarMenuItem key={item.title}>
                     {item.subItems ? (
                      <Collapsible
                        open={expandedGroups[item.title]}
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <div className={getNavClass(item.url)}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1">{item.title}</span>
                                  {expandedGroups[item.title] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </>
                              )}
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink to={subItem.url} className={getNavClass(subItem.url)}>
                                    <span className="ml-6">{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild className="w-full">
                        <NavLink to={item.url} className={getNavClass(item.url)}>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
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