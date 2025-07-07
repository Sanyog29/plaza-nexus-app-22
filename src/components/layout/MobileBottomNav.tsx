import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Calendar, Bell, User, Shield, ChefHat } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAdmin, isStaff } = useAuth(); // Use proper role states
  const { metrics } = useDashboardMetrics();

  if (!user) return null;

  const getNavItems = () => {
    // Role-based navigation - different items for different users
    if (isAdmin || isStaff) {
      return [
        {
          href: isAdmin ? '/admin/dashboard' : '/staff/dashboard',
          icon: Home,
          label: 'Dashboard',
          active: location.pathname.includes('/dashboard')
        },
        {
          href: isStaff ? '/staff/requests' : '/admin/requests',
          icon: Wrench,
          label: 'Requests',
          active: location.pathname.includes('/requests'),
          badge: metrics?.activeRequests || 0
        },
        {
          href: '/security',
          icon: Shield,
          label: 'Security',
          active: location.pathname === '/security'
        },
        {
          href: isStaff ? '/staff/alerts' : '/alerts',
          icon: Bell,
          label: 'Alerts',
          active: location.pathname.includes('/alerts'),
          badge: metrics?.activeAlerts || 0
        },
        {
          href: '/profile',
          icon: User,
          label: 'Profile',
          active: location.pathname === '/profile'
        }
      ];
    }

    // Tenant navigation
    return [
      {
        href: '/',
        icon: Home,
        label: 'Home',
        active: location.pathname === '/'
      },
      {
        href: '/requests',
        icon: Wrench,
        label: 'Requests',
        active: location.pathname.startsWith('/requests'),
        badge: metrics?.activeRequests || 0
      },
      {
        href: '/bookings',
        icon: Calendar,
        label: 'Bookings',
        active: location.pathname === '/bookings'
      },
      {
        href: '/alerts',
        icon: Bell,
        label: 'Alerts',
        active: location.pathname === '/alerts',
        badge: metrics?.activeAlerts || 0
      },
      {
        href: '/profile',
        icon: User,
        label: 'Profile',
        active: location.pathname === '/profile'
      }
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.slice(0, 5).map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                item.active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <IconComponent className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};