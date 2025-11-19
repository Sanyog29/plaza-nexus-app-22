
import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './AuthProvider';
import { PageLoader } from './LoadingSpinner';

// Move lazy import to top level to prevent conditional suspension
const PendingApprovalPage = React.lazy(() => import('./auth/PendingApprovalPage'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, approvalStatus, isAdmin, userRole, userCategory, isFoodVendor } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check approval status - only admins bypass this check
  if (user && !isAdmin && approvalStatus !== 'approved') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PendingApprovalPage />
      </Suspense>
    );
  }

  // Tenant access control - restrict tenants to only their portal
  if (userRole === 'tenant' || userRole === 'super_tenant') {
    const allowedTenantPaths = ['/tenant-portal', '/profile', '/auth'];
    const isAllowedPath = allowedTenantPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      console.warn(`Tenant attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/tenant-portal" replace />;
    }
  }

  // Food vendor access control - STRICT RESTRICTIONS
  if (isFoodVendor || userCategory === 'food_vendor') {
    const allowedFoodVendorPaths = ['/pos', '/profile', '/auth'];
    const isAllowedPath = allowedFoodVendorPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      // Log unauthorized access attempt
      console.warn(`Food vendor attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/pos" replace />;
    }
  }

  // Regular vendor access control - restrict vendors to only their portal
  if (userRole === 'vendor' && !isFoodVendor) {
    const allowedVendorPaths = ['/vendor-portal', '/profile', '/auth'];
    const isAllowedPath = allowedVendorPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      return <Navigate to="/vendor-portal" replace />;
    }
  }

  // Procurement staff access control - STRICT RESTRICTIONS
  if (userRole === 'procurement_manager' || userRole === 'purchase_executive') {
    const allowedProcurementPaths = ['/procurement', '/profile', '/auth'];
    const isAllowedPath = allowedProcurementPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      console.warn(`Procurement staff attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/procurement" replace />;
    }
  }

  // Field Expert (FE) access control - Access to requisitions
  if (userRole === 'fe') {
    const allowedFEPaths = ['/procurement/requisitions', '/procurement/my-requisitions', '/profile', '/auth', '/dashboard', '/staff'];
    const isAllowedPath = allowedFEPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      console.warn(`FE user attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Operations Supervisor & Assistant Manager access control - Access to approvals
  if (userRole === 'ops_supervisor' || userRole === 'assistant_manager') {
    const allowedOpsPaths = [
      '/procurement/pending-approvals',
      '/procurement/approval-history',
      '/procurement/create-requisition',
      '/procurement/my-requisitions',
      '/procurement/requisitions',
      '/operations',
      '/dashboard',
      '/staff',
      '/profile',
      '/auth',
      '/admin'
    ];
    const isAllowedPath = allowedOpsPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      console.warn(`${userRole} attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </>
  );
};

export default ProtectedRoute;
