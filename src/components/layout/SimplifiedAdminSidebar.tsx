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
  Activity,
  Heart,
  Star,
  X,
  Plus,
  Filter,
  Command,
  Network,
  Clock,
  CheckCircle
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebarPreferences } from "@/hooks/useSidebarPreferences";

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
      { title: "Visitor Management", url: "/admin/visitors", icon: UserCheck },
      { title: "Security", url: "/admin/security", icon: Shield },
      { title: "Services Marketplace", url: "/services", icon: Store },
      { title: "Cafeteria Management", url: "/admin/cafeteria", icon: Coffee },
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Booking Management", url: "/admin/bookings", icon: Calendar },
      { title: "Requisition List", url: "/procurement/requisitions", icon: Package },
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
          { title: "Operational Excellence", url: "/admin/operational-excellence" },
          { title: "Advanced Features", url: "/admin/advanced-features" },
          { title: "Reports", url: "/admin/reports" },
          { title: "Unified Dashboard", url: "/admin/unified-dashboard" },
          { title: "Staff Analytics", url: "/staff/analytics" },
          { title: "Quality Control", url: "/admin/quality-control" }
        ] as { title: string; url: string }[]
      },
      { title: "System Health", url: "/admin/system-health", icon: Activity },
      { title: "System Monitoring", url: "/admin/monitoring", icon: Monitor },
      { title: "Search", url: "/admin/search", icon: Search },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: Archive },
    ]
  },
  {
    label: "System & Personal",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings },
      { title: "Content Management", url: "/admin/content", icon: FileText },
      { title: "System Architecture", url: "/architecture", icon: Network },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help", url: "/manual", icon: HelpCircle },
    ]
  }
];

const fieldExpertMenuGroups = [
  {
    label: "My Work",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Requisitions", url: "/procurement/my-requisitions", icon: ClipboardList },
      { title: "Requisition List", url: "/procurement/requisitions", icon: Package },
      { title: "Alerts", url: "/staff/alerts", icon: Bell },
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
      { title: "Security Tasks", url: "/admin/security", icon: Shield },
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
      { title: "Settings", url: "/admin/settings", icon: Cog },
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

const procurementMenuGroups = [
  {
    label: "My Work",
    items: [
      { title: "Dashboard", url: "/procurement", icon: Home },
      { title: "My Requisitions", url: "/procurement/my-requisitions", icon: ClipboardList },
    ]
  },
  {
    label: "Procurement Operations",
    items: [
      { title: "Requisition List", url: "/procurement/requisitions", icon: Package },
      { title: "Item Master", url: "/admin/requisition-master", icon: Database },
      { title: "Vendor Management", url: "/procurement/vendors", icon: Store },
      { title: "Purchase Orders", url: "/procurement/orders", icon: ShoppingCart },
      { title: "Budget Tracking", url: "/procurement/budget", icon: TrendingUp },
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

// Manager menu groups for those with approval permissions
const managerMenuGroups = [
  {
    label: "Manager Dashboard",
    items: [
      { title: "Dashboard", url: "/procurement/manager-dashboard", icon: Home },
      { title: "Pending Approvals", url: "/procurement/pending-approvals", icon: Clock },
      { title: "Approval History", url: "/procurement/approval-history", icon: CheckCircle },
    ]
  },
  {
    label: "My Work",
    items: [
      { title: "My Requisitions", url: "/procurement/my-requisitions", icon: ClipboardList },
    ]
  },
  {
    label: "Procurement Operations",
    items: [
      { title: "Requisition List", url: "/procurement/requisitions", icon: Package },
      { title: "Vendor Management", url: "/procurement/vendors", icon: Store },
      { title: "Purchase Orders", url: "/procurement/orders", icon: ShoppingCart },
      { title: "Budget Tracking", url: "/procurement/budget", icon: TrendingUp },
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
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { preferences, updatePreferences, toggleFavorite } = useSidebarPreferences();
  const [recentlyUsed, setRecentlyUsed] = React.useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = React.useState(true);

  const getMenuGroups = () => {
    switch (userRole) {
      // Executive/Admin Level - Full admin access
      case 'super_admin':
      case 'admin':
      case 'ops_supervisor':
      case 'ceo':
      case 'cxo':
      case 'vp':
      case 'assistant_vice_president':
      case 'assistant_general_manager':
        return adminMenuGroups;

      // Manager roles with approval permissions
      case 'procurement_manager':
        return managerMenuGroups;
      
      // Purchase executives - regular procurement access
      case 'purchase_executive':
        return procurementMenuGroups;
        
      // Management, Staff, Operations & Vendors - Staff level access with requests
      case 'assistant_manager':
      case 'assistant_floor_manager':
      case 'field_staff':
      case 'ops_l1':
      case 'ops_l2':
      case 'mst':
      case 'hk':
      case 'se':
      case 'vendor':
      case 'food_vendor':
        return staffMenuGroups;
      
      // Field Expert (FE) - Special menu with requisition access
      case 'fe':
        return fieldExpertMenuGroups;
        
      // Tenants - Limited access
      default:
        return tenantMenuGroups;
    }
  };

  const menuGroups = getMenuGroups();
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isCollapsed = state === 'collapsed';

  // Track recently used and update favorites
  React.useEffect(() => {
    if (currentPath !== '/') {
      setRecentlyUsed(prev => {
        const updated = [currentPath, ...prev.filter(path => path !== currentPath)].slice(0, 5);
        return updated;
      });
    }
  }, [currentPath]);

  // Filter menu items based on search
  const filteredMenuGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;
    
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter((item: any) => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subItems && item.subItems.some((sub: any) => 
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      )
    })).filter(group => group.items.length > 0);
  }, [menuGroups, searchQuery]);

  // Get favorite items
  const favoriteItems = React.useMemo(() => {
    const items: any[] = [];
    menuGroups.forEach(group => {
      group.items.forEach((item: any) => {
        if (preferences.favorites.includes(item.url)) {
          items.push(item);
        }
        if (item.subItems) {
          item.subItems.forEach((subItem: any) => {
            if (preferences.favorites.includes(subItem.url)) {
              items.push(subItem);
            }
          });
        }
      });
    });
    return items;
  }, [menuGroups, preferences.favorites]);

  const quickActionItems = [
    { title: 'New Request', url: '/requests/new', icon: Plus },
    { title: 'Manage Processes', url: '/admin/quick-actions', icon: Cog },
    { title: 'Emergency Alert', url: '/alerts/emergency', icon: Bell },
    { title: 'Quick Report', url: '/reports/quick', icon: FileText },
    { title: 'System Status', url: '/admin/system-health', icon: Activity }
  ];

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

  // Enhanced keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.getElementById('sidebar-search')?.focus();
            break;
          case 'f':
            e.preventDefault();
            setShowQuickActions(prev => !prev);
            break;
        }
      }
      
      if (e.target && (e.target as HTMLElement).closest('[data-sidebar]')) {
        const focusableElements = sidebarRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled])'
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
                <h2 className="font-bold text-foreground text-lg">AUTOPILOT</h2>
                <p className="text-xs text-muted-foreground/80 capitalize font-medium">
                  {userRole === 'admin' ? 'Admin' : 
                   userRole === 'ops_supervisor' ? 'Supervisor' :
                   userRole.includes('staff') ? 'Staff' :
                   'Tenant'} Portal
                </p>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          {!isCollapsed && (
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sidebar-search"
                type="text"
                placeholder="Search features... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 text-sm bg-background/50 border-border/50 focus:bg-background"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Quick Actions Bar */}
          {!isCollapsed && showQuickActions && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Actions
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowQuickActions(false)}
                  title="Hide quick actions (Ctrl+F)"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {quickActionItems.slice(0, 6).map((action) => (
                  <NavLink
                    key={action.url}
                    to={action.url}
                    className="flex items-center space-x-1 p-2 text-xs bg-accent/30 hover:bg-accent/50 rounded transition-colors"
                  >
                    <action.icon className="h-3 w-3" />
                    <span className="truncate">{action.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {!isCollapsed && preferences.favorites.length > 0 && !searchQuery && (
          <div className="px-3 py-2 border-b border-border/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3">
                <Star className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Favorites
                </span>
                <Badge variant="secondary" className="text-xs">
                  {preferences.favorites.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {favoriteItems.slice(0, 3).map((item) => {
                  const active = isActive(item.url);
                  const Icon = item.icon;
                  
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                        active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Summary */}
        {!isCollapsed && searchQuery && (
          <div className="px-3 py-2 border-b border-border/30">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>
                {filteredMenuGroups.reduce((acc, group) => acc + group.items.length, 0)} results for "{searchQuery}"
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Groups with Enhanced Styling */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredMenuGroups.map((group, groupIndex) => (
            <SidebarGroup key={group.label} className="space-y-2">
              {!isCollapsed && (
                <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                  {group.label}
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {group.items.length}
                    </Badge>
                  )}
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
                        <div className="relative group/item">
                          <SidebarMenuButton asChild className="w-full p-0 hover:bg-transparent">
                            <NavLink 
                              to={item.url} 
                              className={getNavClass(item.url)}
                              tabIndex={0}
                            >
                              <item.icon className="h-5 w-5 flex-shrink-0 text-current" />
                              {!isCollapsed && <span className="font-medium flex-1">{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                          
                          {/* Favorite toggle */}
                          {!isCollapsed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                              }}
                              title={preferences.favorites.includes(item.url) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`h-3 w-3 ${
                                preferences.favorites.includes(item.url) ? 'fill-current text-red-500' : 'text-muted-foreground'
                              }`} />
                            </Button>
                          )}
                        </div>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              
              {/* Visual separator between groups */}
              {groupIndex < filteredMenuGroups.length - 1 && !isCollapsed && (
                <div className="mt-4 mx-3 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
              )}
            </SidebarGroup>
          ))}
        </div>

        {/* Footer with Keyboard Shortcuts */}
        {!isCollapsed && (
          <div className="px-3 py-3 border-t border-border/30 bg-gradient-to-r from-background/50 to-accent/5">
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Keyboard shortcuts:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => updatePreferences({ quickActionsVisible: !showQuickActions })}
                >
                  <Command className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd>
                  <span>Search</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+F</kbd>
                  <span>Quick Actions</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/20">
                <span className="text-xs">
                  {preferences.favorites.length} favorites • {recentlyUsed.length} recent
                </span>
              </div>
            </div>
          </div>
        )}

      </SidebarContent>
    </Sidebar>
  );
}