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

// Phase 1: Consolidated menu structure for better UX
const adminMenuGroups = [
  {
    label: "Core Operations",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      { title: "Requests", url: "/admin/requests", icon: ClipboardList },
      { title: "Alerts", url: "/alerts", icon: Bell },
      { title: "Quick Actions", url: "/admin/quick-actions", icon: Zap },
    ]
  },
  {
    label: "Management Hub",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "Assets", url: "/admin/assets", icon: Building },
      { title: "Security", url: "/admin/security", icon: Shield },
      { title: "Services Marketplace", url: "/services", icon: Store },
      { title: "Cafeteria Management", url: "/admin/cafeteria", icon: Coffee },
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Bookings", url: "/bookings", icon: Calendar },
    ]
  },
  {
    label: "Analytics & Intelligence",
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
      { title: "Search", url: "/admin/search", icon: Search },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: Archive },
    ]
  },
  {
    label: "System & Personal",
    items: [
      { title: "Settings", url: "/admin/system-config", icon: Settings },
      { title: "Content Management", url: "/admin/content", icon: FileText },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
    ]
  }
];

const staffMenuGroups = [
  {
    label: "Daily Work",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Tasks", url: "/staff/tasks", icon: ClipboardList },
      { title: "Requests", url: "/staff/requests", icon: Wrench },
      { title: "Alerts", url: "/staff/alerts", icon: Bell },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Maintenance", url: "/staff/maintenance", icon: Building },
      { title: "Security Tasks", url: "/staff/security", icon: Shield },
      { title: "Services", url: "/staff/services", icon: Store },
      { title: "Schedule", url: "/staff/schedule", icon: Calendar },
      { title: "Operations Center", url: "/staff/operations", icon: Monitor },
    ]
  },
  {
    label: "Performance",
    items: [
      { title: "My Analytics", url: "/staff/analytics", icon: BarChart3 },
      { title: "Reports", url: "/staff/reports", icon: FileText },
      { title: "Training", url: "/staff/training", icon: BookOpen },
    ]
  },
  {
    label: "Tools & Personal",
    items: [
      { title: "Search", url: "/staff/search", icon: Search },
      { title: "Settings", url: "/staff/settings", icon: Cog },
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
      { title: "Room Bookings", url: "/bookings", icon: Calendar },
      { title: "Alerts", url: "/alerts", icon: Bell },
    ]
  },
  {
    label: "Facilities",
    items: [
      { title: "Services Marketplace", url: "/services", icon: Store },
      { title: "Cafeteria", url: "/cafeteria", icon: Coffee },
      { title: "Delivery Tracking", url: "/delivery", icon: Truck },
      { title: "Info Hub", url: "/info-hub", icon: MapPin },
    ]
  },
  {
    label: "Personal",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
      { title: "Security", url: "/security", icon: Shield },
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
  const sidebarRef = React.useRef<HTMLDivElement>(null);

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

  // Enhanced navigation styling with better hierarchy
  const getNavClass = (path: string, isSubItem = false) => {
    const active = isActive(path);
    const baseClasses = `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative`;
    const spacing = isSubItem ? 'ml-6' : '';
    
    if (active) {
      return `${baseClasses} ${spacing} bg-primary text-primary-foreground font-medium shadow-lg scale-[1.02]`;
    }
    
    return `${baseClasses} ${spacing} text-foreground/80 hover:text-foreground hover:bg-accent/50 hover:shadow-md hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`;
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('[data-sidebar]')) {
        const focusableElements = sidebarRef.current?.querySelectorAll(
          'a[href], button:not([disabled])'
        );
        
        if (!focusableElements) return;
        
        const currentIndex = Array.from(focusableElements).indexOf(e.target as Element);
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % focusableElements.length;
            (focusableElements[nextIndex] as HTMLElement).focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
            (focusableElements[prevIndex] as HTMLElement).focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Sidebar 
      ref={sidebarRef}
      className="border-r border-border/50 backdrop-blur-xl bg-background/95 shadow-xl" 
      collapsible="icon"
      data-sidebar
    >
      <SidebarContent className="bg-gradient-to-b from-background/90 to-background/95">
        {/* Enhanced Header with Quick Actions */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/20">
              <span className="text-primary-foreground font-bold text-sm">SP</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <h2 className="font-bold text-foreground text-lg">SS Plaza</h2>
                <p className="text-xs text-muted-foreground/80 capitalize font-medium">
                  {userRole === 'admin' ? 'Admin' : 
                   userRole === 'ops_supervisor' ? 'Supervisor' :
                   userRole.includes('staff') ? 'Staff' :
                   'Tenant'} Portal
                </p>
              </div>
            )}
          </div>
          
          {/* Quick Actions Bar */}
          {!isCollapsed && (
            <div className="mt-3 flex gap-2">
              <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <Search className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <Bell className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <Zap className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Groups with Enhanced Styling */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuGroups.map((group, groupIndex) => (
            <SidebarGroup key={group.label} className="space-y-2">
              {!isCollapsed && (
                <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                  {group.label}
                </SidebarGroupLabel>
              )}
              
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item: any, itemIndex) => (
                    <SidebarMenuItem key={item.title} className="relative">
                      {item.subItems ? (
                        <Collapsible
                          open={expandedGroups[item.title]}
                          onOpenChange={() => toggleGroup(item.title)}
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton 
                              className="w-full p-0 hover:bg-transparent"
                              tabIndex={0}
                            >
                              <div className={getNavClass(item.url)}>
                                <item.icon className="h-5 w-5 flex-shrink-0 text-current" />
                                {!isCollapsed && (
                                  <>
                                    <span className="flex-1 font-medium">{item.title}</span>
                                    <div className="p-1 rounded-md transition-transform duration-200">
                                      {expandedGroups[item.title] ? (
                                        <ChevronDown className="h-4 w-4 transform rotate-0" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 transform rotate-0" />
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out">
                            <SidebarMenuSub className="ml-3 mt-2 space-y-1 border-l border-border/30 pl-3">
                              {item.subItems.map((subItem: any) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild className="p-0">
                                    <NavLink 
                                      to={subItem.url} 
                                      className={getNavClass(subItem.url, true)}
                                      tabIndex={0}
                                    >
                                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors duration-200"></div>
                                      <span className="font-medium">{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton asChild className="w-full p-0 hover:bg-transparent">
                          <NavLink 
                            to={item.url} 
                            className={getNavClass(item.url)}
                            tabIndex={0}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0 text-current" />
                            {!isCollapsed && <span className="font-medium">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              
              {/* Visual separator between groups */}
              {groupIndex < menuGroups.length - 1 && !isCollapsed && (
                <div className="mt-4 mx-3 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
              )}
            </SidebarGroup>
          ))}
        </div>

      </SidebarContent>
    </Sidebar>
  );
}