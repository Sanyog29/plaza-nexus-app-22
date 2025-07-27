import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext';
import { routeConfigs } from '@/config/routes';
import { BreadcrumbItem, RouteConfig } from '@/types/breadcrumb';
import { useAuth } from '@/components/AuthProvider';

export const useBreadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const { userRole, isAdmin, isStaff } = useAuth();
  const { setBreadcrumbs } = useBreadcrumbContext();

  const hasPermission = (permissions?: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    
    if (isAdmin && permissions.includes('admin')) return true;
    if (isStaff && permissions.includes('staff')) return true;
    if (userRole && permissions.includes(userRole)) return true;
    
    return false;
  };

  const findMatchingRoute = (pathname: string): RouteConfig | null => {
    // First try exact match
    const exactMatch = routeConfigs.find(config => config.path === pathname);
    if (exactMatch) return exactMatch;

    // Then try dynamic routes
    for (const config of routeConfigs) {
      if (config.dynamic) {
        const routePattern = config.path.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${routePattern}$`);
        if (regex.test(pathname)) {
          return config;
        }
      }
    }

    return null;
  };

  const buildBreadcrumbChain = (route: RouteConfig): BreadcrumbItem[] => {
    const chain: BreadcrumbItem[] = [];
    
    const buildChain = (currentRoute: RouteConfig) => {
      // Check permissions
      if (!hasPermission(currentRoute.permissions)) return;

      // Generate label for dynamic routes
      let label = currentRoute.label;
      if (currentRoute.dynamic && currentRoute.labelGenerator) {
        label = currentRoute.labelGenerator(params);
      }

      const breadcrumb: BreadcrumbItem = {
        label,
        href: currentRoute.path.replace(/:[^/]+/g, (match) => {
          const paramName = match.slice(1);
          return params[paramName] || match;
        }),
        icon: currentRoute.icon,
        permissions: currentRoute.permissions,
      };

      chain.unshift(breadcrumb);

      // Find parent route
      if (currentRoute.parent) {
        const parentRoute = routeConfigs.find(config => {
          if (config.dynamic) {
            const parentPattern = config.path.replace(/:[^/]+/g, '([^/]+)');
            const regex = new RegExp(`^${parentPattern}$`);
            return regex.test(currentRoute.parent!);
          }
          return config.path === currentRoute.parent;
        });
        
        if (parentRoute) {
          buildChain(parentRoute);
        }
      }
    };

    buildChain(route);
    return chain;
  };

  const generateBreadcrumbs = useMemo(() => {
    console.log('🍞 Breadcrumb Debug - Generating for:', location.pathname);
    
    const currentRoute = findMatchingRoute(location.pathname);
    console.log('🍞 Breadcrumb Debug - Found route:', currentRoute);
    
    if (!currentRoute) {
      console.log('🍞 Breadcrumb Debug - No route found, using fallback');
      // Fallback breadcrumbs for unknown routes
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const fallbackBreadcrumbs = pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        return {
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
          href,
          isActive: index === pathSegments.length - 1,
        };
      });
      console.log('🍞 Breadcrumb Debug - Fallback breadcrumbs:', fallbackBreadcrumbs);
      return fallbackBreadcrumbs;
    }

    console.log('🍞 Breadcrumb Debug - Building chain for route:', currentRoute);
    const breadcrumbs = buildBreadcrumbChain(currentRoute);
    console.log('🍞 Breadcrumb Debug - Built breadcrumbs:', breadcrumbs);
    
    // Mark the last breadcrumb as active
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isActive = true;
    }

    console.log('🍞 Breadcrumb Debug - Final breadcrumbs:', breadcrumbs);
    return breadcrumbs;
  }, [location.pathname, params, userRole, isAdmin, isStaff]);

  useEffect(() => {
    setBreadcrumbs(generateBreadcrumbs);
  }, [generateBreadcrumbs, setBreadcrumbs]);

  return {
    breadcrumbs: generateBreadcrumbs,
    hasPermission,
  };
};