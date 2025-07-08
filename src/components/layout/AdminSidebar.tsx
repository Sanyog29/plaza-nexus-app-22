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
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Security & Visitors", url: "/admin/security", icon: Shield },
      { title: "Services Hub", url: "/admin/services", icon: Building },
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

// Operations Supervisor Menu Structure
const opsSupervisorMenuGroups = [
  {
    label: "Supervision",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "Staff Management", url: "/staff/operations", icon: Users },
      { title: "Staff Performance", url: "/staff/performance", icon: Activity },
      { title: "Task Assignment", url: "/staff/requests", icon: ClipboardList },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Maintenance Hub", url: "/staff/maintenance", icon: Wrench },
      { title: "Security Operations", url: "/staff/security", icon: Shield },
      { title: "Services Management", url: "/staff/services", icon: Building },
    ]
  },
  {
    label: "Analytics & Reports",
    items: [
      { title: "Performance Analytics", url: "/staff/reports", icon: BarChart3 },
      { title: "System Health", url: "/unified-dashboard", icon: Activity },
      { title: "Staff Alerts", url: "/staff/alerts", icon: AlertTriangle },
    ]
  },
  {
    label: "Training & Settings",
    items: [
      { title: "Staff Training", url: "/staff/training", icon: GraduationCap },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Settings", url: "/staff/settings", icon: Settings },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// Security Staff Menu Structure
const securityStaffMenuGroups = [
  {
    label: "Security Operations",
    items: [
      { title: "Security Dashboard", url: "/security", icon: Shield },
      { title: "Visitor Management", url: "/staff/security", icon: Users },
      { title: "Security Rounds", url: "/staff/security", icon: Activity },
      { title: "Incident Reports", url: "/staff/security", icon: AlertTriangle },
    ]
  },
  {
    label: "Daily Tasks",
    items: [
      { title: "My Tasks", url: "/staff/operations", icon: ClipboardList },
      { title: "Active Requests", url: "/staff/requests", icon: Wrench },
      { title: "Daily Checklists", url: "/staff/maintenance", icon: Calendar },
    ]
  },
  {
    label: "Resources",
    items: [
      { title: "Performance Metrics", url: "/staff/performance", icon: BarChart3 },
      { title: "Training Center", url: "/staff/training", icon: GraduationCap },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// Housekeeping Staff Menu Structure
const housekeepingStaffMenuGroups = [
  {
    label: "Housekeeping Operations",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "Cleaning Tasks", url: "/staff/operations", icon: ClipboardList },
      { title: "Supply Management", url: "/staff/maintenance", icon: Building },
      { title: "Area Inspections", url: "/staff/requests", icon: Activity },
    ]
  },
  {
    label: "Daily Management",
    items: [
      { title: "Active Requests", url: "/staff/requests", icon: Wrench },
      { title: "Daily Checklists", url: "/staff/maintenance", icon: Calendar },
      { title: "Performance Metrics", url: "/staff/performance", icon: BarChart3 },
    ]
  },
  {
    label: "Resources",
    items: [
      { title: "Training Center", url: "/staff/training", icon: GraduationCap },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// General Field Staff Menu Structure
const fieldStaffMenuGroups = [
  {
    label: "Daily Operations",
    items: [
      { title: "Dashboard", url: "/staff/dashboard", icon: Home },
      { title: "My Tasks", url: "/staff/operations", icon: ClipboardList },
      { title: "Active Requests", url: "/staff/requests", icon: Wrench },
      { title: "Maintenance Hub", url: "/staff/maintenance", icon: Building },
    ]
  },
  {
    label: "Performance & Training",
    items: [
      { title: "Performance Metrics", url: "/staff/performance", icon: Activity },
      { title: "Training Center", url: "/staff/training", icon: GraduationCap },
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// Tenant Manager Menu Structure
const tenantManagerMenuGroups = [
  {
    label: "Tenant Services",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "My Requests", url: "/requests", icon: ClipboardList },
      { title: "New Request", url: "/new-request", icon: Wrench },
      { title: "Services", url: "/services", icon: Building },
    ]
  },
  {
    label: "Facility Access",
    items: [
      { title: "Room Bookings", url: "/bookings", icon: Calendar },
      { title: "Cafeteria", url: "/cafeteria", icon: ChefHat },
      { title: "Info Hub", url: "/info-hub", icon: Info },
    ]
  },
  {
    label: "Personal",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

// Vendor Menu Structure
const vendorMenuGroups = [
  {
    label: "Vendor Operations",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Assigned Tasks", url: "/requests", icon: ClipboardList },
      { title: "Work Orders", url: "/maintenance", icon: Wrench },
    ]
  },
  {
    label: "Resources",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Help & Manual", url: "/manual", icon: HelpCircle },
    ]
  }
];

interface AdminSidebarProps {
  userRole: string;
  userDepartment?: string;
}

export function AdminSidebar({ userRole, userDepartment }: AdminSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const getMenuGroups = () => {
    console.log('Getting menu groups for role:', userRole, 'department:', userDepartment);
    switch (userRole) {
      case 'admin':
        return adminMenuGroups;
      case 'ops_supervisor':
        return opsSupervisorMenuGroups;
      case 'field_staff':
        // Department-specific menus for field staff
        if (userDepartment === 'security') {
          return securityStaffMenuGroups;
        } else if (userDepartment === 'housekeeping') {
          return housekeepingStaffMenuGroups;
        }
        return fieldStaffMenuGroups;
      case 'tenant_manager':
        return tenantManagerMenuGroups;
      case 'vendor':
        return vendorMenuGroups;
      default:
        console.log('Using default tenant manager menu for role:', userRole);
        return tenantManagerMenuGroups; // Default fallback
    }
  };

  const menuGroups = getMenuGroups();
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
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole === 'ops_supervisor' ? 'Operations Supervisor' : 
                     userRole === 'field_staff' ? `${userDepartment || 'Field'} Staff` :
                     userRole === 'tenant_manager' ? 'Tenant' :
                     userRole === 'vendor' ? 'Vendor' :
                     userRole} Panel
                  </p>
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