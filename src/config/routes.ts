import { 
  Home, Users, Wrench, Building, FileText, Settings, BarChart3, 
  Calendar, Coffee, Shield, Car, Package, Mail, Bell, Search,
  Activity, TrendingUp, Workflow, Brain, FileBarChart, Target,
  UserCheck, Zap, Database, Gauge, AlertTriangle, ClipboardList,
  Eye, CheckSquare, AlertOctagon, Clock, MapPin
} from 'lucide-react';
import { RouteConfig } from '@/types/breadcrumb';

export const routeConfigs: RouteConfig[] = [
  // Root routes
  { path: '/', label: 'Home', icon: Home },
  { path: '/admin', label: 'Admin Dashboard', icon: Settings },
  { path: '/staff', label: 'Staff Dashboard', icon: Activity },

  // User routes
  { path: '/requests', label: 'Requests', icon: FileText, parent: '/' },
  { path: '/requests/new', label: 'New Request', icon: FileText, parent: '/requests' },
  { path: '/requests/:id', label: 'Request Details', icon: FileText, parent: '/requests', dynamic: true,
    labelGenerator: (params) => `Request #${params.id?.slice(0, 8)}` },
  { path: '/requests/:id/edit', label: 'Edit Request', icon: FileText, parent: '/requests/:id', dynamic: true },

  { path: '/bookings', label: 'Bookings', icon: Calendar, parent: '/' },
  { path: '/bookings/new', label: 'New Booking', icon: Calendar, parent: '/bookings' },
  { path: '/bookings/:id', label: 'Booking Details', icon: Calendar, parent: '/bookings', dynamic: true,
    labelGenerator: (params) => `Booking #${params.id?.slice(0, 8)}` },

  { path: '/cafeteria', label: 'Cafeteria', icon: Coffee, parent: '/' },
  { path: '/cafeteria/vendors/:vendorId', label: 'Vendor Menu', icon: Coffee, parent: '/cafeteria', dynamic: true },
  { path: '/cafeteria/orders', label: 'My Orders', icon: Coffee, parent: '/cafeteria' },
  { path: '/cafeteria/orders/:orderId', label: 'Order Details', icon: Coffee, parent: '/cafeteria/orders', dynamic: true,
    labelGenerator: (params) => `Order #${params.orderId?.slice(0, 8)}` },

  { path: '/services', label: 'Services', icon: Package, parent: '/' },
  { path: '/services/:category', label: 'Service Category', icon: Package, parent: '/services', dynamic: true,
    labelGenerator: (params) => params.category?.charAt(0).toUpperCase() + params.category?.slice(1).replace('-', ' ') || 'Category' },

  { path: '/security', label: 'Security', icon: Shield, parent: '/' },
  { path: '/security/visitors', label: 'Visitor Registration', icon: Shield, parent: '/security' },
  { path: '/security/parking', label: 'Parking Requests', icon: Car, parent: '/security' },

  { path: '/profile', label: 'Profile', icon: UserCheck, parent: '/' },
  { path: '/profile/settings', label: 'Settings', icon: Settings, parent: '/profile' },
  { path: '/profile/preferences', label: 'Preferences', icon: Settings, parent: '/profile/settings' },

  // Admin routes
  { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp, parent: '/admin/dashboard', permissions: ['admin', 'staff'] },
  { path: '/admin/reports', label: 'Reports', icon: FileBarChart, parent: '/admin/analytics', permissions: ['admin', 'staff'] },

  { path: '/admin/users', label: 'User Management', icon: Users, parent: '/admin', permissions: ['admin'] },
  { path: '/admin/users/:userId', label: 'User Details', icon: Users, parent: '/admin/users', dynamic: true, permissions: ['admin'],
    labelGenerator: (params) => `User Profile` },
  { path: '/admin/users/:userId/permissions', label: 'Permissions', icon: Users, parent: '/admin/users/:userId', dynamic: true, permissions: ['admin'] },

  { path: '/admin/assets', label: 'Asset Management', icon: Building, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/assets/:assetId', label: 'Asset Details', icon: Building, parent: '/admin/assets', dynamic: true, permissions: ['admin', 'staff'],
    labelGenerator: (params) => `Asset Details` },
  { path: '/admin/assets/:assetId/maintenance', label: 'Maintenance History', icon: Wrench, parent: '/admin/assets/:assetId', dynamic: true, permissions: ['admin', 'staff'] },

  { path: '/admin/requests', label: 'Request Management', icon: ClipboardList, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/requests/:requestId', label: 'Request Details', icon: ClipboardList, parent: '/admin/requests', dynamic: true, permissions: ['admin', 'staff'],
    labelGenerator: (params) => `Request #${params.requestId?.slice(0, 8)}` },
  { path: '/admin/requests/:requestId/assign', label: 'Assignment', icon: UserCheck, parent: '/admin/requests/:requestId', dynamic: true, permissions: ['admin', 'staff'] },
  { path: '/admin/requests/:requestId/resolution', label: 'Resolution', icon: Zap, parent: '/admin/requests/:requestId', dynamic: true, permissions: ['admin', 'staff'] },

  { path: '/admin/settings', label: 'System Settings', icon: Settings, parent: '/admin', permissions: ['admin'] },
  { path: '/admin/settings/config', label: 'System Config', icon: Settings, parent: '/admin/settings', permissions: ['admin'] },
  { path: '/admin/settings/database', label: 'Database', icon: Database, parent: '/admin/settings/config', permissions: ['admin'] },
  { path: '/admin/settings/optimization', label: 'Optimization', icon: Gauge, parent: '/admin/settings/database', permissions: ['admin'] },

  // Visitor Management System
  { path: '/admin/visitors', label: 'Visitor Management', icon: UserCheck, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/visitors/registration', label: 'Registration', icon: ClipboardList, parent: '/admin/visitors', permissions: ['admin', 'staff'] },
  { path: '/admin/visitors/dashboard', label: 'Dashboard', icon: Eye, parent: '/admin/visitors', permissions: ['admin', 'staff'] },
  { path: '/admin/visitors/security', label: 'Security Console', icon: Shield, parent: '/admin/visitors', permissions: ['admin', 'staff'] },
  { path: '/admin/visitors/emergency', label: 'Emergency Management', icon: AlertOctagon, parent: '/admin/visitors', permissions: ['admin', 'staff'] },
  { path: '/admin/visitors/analytics', label: 'Analytics', icon: BarChart3, parent: '/admin/visitors', permissions: ['admin', 'staff'] },

  // Alerts and Monitoring
  { path: '/admin/alerts', label: 'Facility Alerts', icon: AlertTriangle, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/alerts/:alertId', label: 'Alert Details', icon: AlertTriangle, parent: '/admin/alerts', dynamic: true, permissions: ['admin', 'staff'],
    labelGenerator: (params) => `Alert #${params.alertId?.slice(0, 8)}` },

  // IoT and Sensor Management (placeholder for future implementation)
  { path: '/admin/iot', label: 'IoT Management', icon: Zap, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/iot/sensors', label: 'Sensors', icon: Activity, parent: '/admin/iot', permissions: ['admin', 'staff'] },
  { path: '/admin/iot/monitoring', label: 'Monitoring', icon: Eye, parent: '/admin/iot', permissions: ['admin', 'staff'] },

  // Services Management
  { path: '/admin/services', label: 'Services Management', icon: Package, parent: '/admin', permissions: ['admin', 'staff'] },
  { path: '/admin/services/providers', label: 'Providers', icon: Users, parent: '/admin/services', permissions: ['admin', 'staff'] },
  { path: '/admin/services/bookings', label: 'Bookings', icon: Calendar, parent: '/admin/services', permissions: ['admin', 'staff'] },

  { path: '/admin/operational-excellence', label: 'Operational Excellence', icon: Target, parent: '/admin', permissions: ['admin', 'ops_supervisor'] },
  { path: '/operational-excellence', label: 'Operational Excellence', icon: Target, parent: '/admin', permissions: ['admin', 'ops_supervisor'] },
  { path: '/operational-excellence/workflows', label: 'Workflows', icon: Workflow, parent: '/operational-excellence', permissions: ['admin', 'ops_supervisor'] },
  { path: '/operational-excellence/insights', label: 'Cross-Module Insights', icon: Brain, parent: '/operational-excellence', permissions: ['admin', 'ops_supervisor'] },
  { path: '/operational-excellence/reporting', label: 'Advanced Reporting', icon: FileBarChart, parent: '/operational-excellence', permissions: ['admin', 'ops_supervisor'] },

  // Staff routes
  { path: '/staff/dashboard', label: 'Dashboard', icon: Activity, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/tasks', label: 'Tasks', icon: ClipboardList, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/tasks/:taskId', label: 'Task Details', icon: ClipboardList, parent: '/staff/tasks', dynamic: true, permissions: ['staff'],
    labelGenerator: (params) => `Task #${params.taskId?.slice(0, 8)}` },
  { path: '/staff/tasks/:taskId/completion', label: 'Completion', icon: Zap, parent: '/staff/tasks/:taskId', dynamic: true, permissions: ['staff'] },

  { path: '/staff/maintenance', label: 'Maintenance', icon: Wrench, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/maintenance/requests', label: 'Requests', icon: ClipboardList, parent: '/staff/maintenance', permissions: ['staff'] },
  { path: '/staff/maintenance/requests/:requestId', label: 'Assignment', icon: UserCheck, parent: '/staff/maintenance/requests', dynamic: true, permissions: ['staff'] },
  { path: '/staff/maintenance/work-orders', label: 'Work Orders', icon: FileText, parent: '/staff/maintenance/requests/:requestId', dynamic: true, permissions: ['staff'] },

  { path: '/staff/analytics', label: 'Analytics', icon: BarChart3, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/analytics/performance', label: 'Performance', icon: TrendingUp, parent: '/staff/analytics', permissions: ['staff'] },
  { path: '/staff/analytics/reports', label: 'Reports', icon: FileBarChart, parent: '/staff/analytics/performance', permissions: ['staff'] },
  { path: '/staff/analytics/insights', label: 'Insights', icon: Brain, parent: '/staff/analytics/reports', permissions: ['staff'] },

  { path: '/staff/security', label: 'Security', icon: Shield, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/security/checks', label: 'Security Checks', icon: Shield, parent: '/staff/security', permissions: ['staff'] },
  { path: '/staff/security/incidents', label: 'Incidents', icon: AlertTriangle, parent: '/staff/security/checks', permissions: ['staff'] },
  { path: '/staff/security/reports', label: 'Security Reports', icon: FileBarChart, parent: '/staff/security/incidents', permissions: ['staff'] },

  // Staff Alerts
  { path: '/staff/alerts', label: 'Alerts', icon: AlertTriangle, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/alerts/:alertId', label: 'Alert Details', icon: AlertTriangle, parent: '/staff/alerts', dynamic: true, permissions: ['staff'],
    labelGenerator: (params) => `Alert #${params.alertId?.slice(0, 8)}` },

  // Staff Services
  { path: '/staff/services', label: 'Service Delivery', icon: Package, parent: '/staff', permissions: ['staff'] },
  { path: '/staff/services/assignments', label: 'Assignments', icon: ClipboardList, parent: '/staff/services', permissions: ['staff'] },
  { path: '/staff/services/schedule', label: 'Schedule', icon: Clock, parent: '/staff/services', permissions: ['staff'] },
];