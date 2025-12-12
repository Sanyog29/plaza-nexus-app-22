import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  userCategory: string | null;
  userDepartment: string | null;
  departmentSpecialization: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStaff: boolean;
  isTenant: boolean;
  isVendor: boolean;
  isFoodVendor: boolean;
  isProcurementStaff: boolean;
  isFieldExpert: boolean;
  // Internal role level checks (not exposed in UI)
  isL1: boolean;
  isL2: boolean;
  isL3: boolean;
  isL4: boolean;
  isManagement: boolean;
  isLoading: boolean;
  permissions: Record<string, boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  userCategory: null,
  userDepartment: null,
  departmentSpecialization: null,
  approvalStatus: null,
  isAdmin: false,
  isSuperAdmin: false,
  isStaff: false,
  isTenant: false,
  isVendor: false,
  isFoodVendor: false,
  isProcurementStaff: false,
  isFieldExpert: false,
  isL1: false,
  isL2: false,
  isL3: false,
  isL4: false,
  isManagement: false,
  isLoading: true,
  permissions: {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [departmentSpecialization, setDepartmentSpecialization] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isFoodVendor, setIsFoodVendor] = useState(false);
  const [isFieldExpert, setIsFieldExpert] = useState(false);
  const [isL1, setIsL1] = useState(false);
  const [isL2, setIsL2] = useState(false);
  const [isL3, setIsL3] = useState(false);
  const [isL4, setIsL4] = useState(false);
  const [isManagement, setIsManagement] = useState(false);
  const [isProcurementStaff, setIsProcurementStaff] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const updateRoleStates = React.useCallback((role: string, category: string, specialization?: string) => {
    setUserRole(role);
    setUserCategory(category);
    setDepartmentSpecialization(specialization || null);
    setIsAdmin(role === 'admin' || role === 'super_admin');
    setIsSuperAdmin(role === 'super_admin');
    setIsTenant(role === 'tenant');
    setIsVendor(role === 'vendor');
    setIsFoodVendor(category === 'food_vendor');
    setIsFieldExpert(role === 'fe');
    
    // Set internal level flags (not exposed in UI)
    const l1Roles = ['mst', 'fe', 'hk', 'se', 'bms_operator'];
    const l2Roles = ['assistant_manager', 'assistant_floor_manager', 'super_tenant'];
    const l3Roles = ['assistant_general_manager', 'assistant_vice_president'];
    const l4Roles = ['vp', 'ceo', 'cxo'];
    
    setIsL1(l1Roles.includes(role));
    setIsL2(l2Roles.includes(role));
    setIsL3(l3Roles.includes(role));
    setIsL4(l4Roles.includes(role));
    setIsManagement(l2Roles.includes(role) || l3Roles.includes(role) || l4Roles.includes(role));
    
    // Procurement staff roles
    const procurementRoles = ['procurement_manager', 'purchase_executive'];
    setIsProcurementStaff(procurementRoles.includes(role));
    
    // Staff includes admin and L1/L2/L3 roles (operational and management staff)
    // Note: super_tenant is excluded from staff - they get tenant layout with enhanced permissions
    const staffRoles = ['admin', ...l1Roles, ...l2Roles.filter(r => r !== 'super_tenant'), ...l3Roles];
    setIsStaff(staffRoles.includes(role));

    // Enhanced permissions based on feature-to-role matrix
    const rolePermissions = {
      admin: {
        can_manage_users: true,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: true,
        can_view_analytics: true,
        can_manage_vendors: true,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: true,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: true,
      },
      // L2 Management roles
      assistant_manager: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: true,
      },
      assistant_floor_manager: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: true,
      },
      // L3 Senior Management roles
      assistant_general_manager: {
        can_manage_users: true,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: true,
        can_view_analytics: true,
        can_manage_vendors: true,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: true,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: true,
      },
      assistant_vice_president: {
        can_manage_users: true,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: true,
        can_view_analytics: true,
        can_manage_vendors: true,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: true,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: true,
      },
      // L4 Executive roles
      vp: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      ceo: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      cxo: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      // L1 Operational staff
      mst: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      fe: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      hk: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      se: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      bms_operator: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      // Tenant role (formerly tenant_manager)
      tenant: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,
        can_configure_auto_assign: false,
      },
      // Super Tenant - Read-only access to all requests + analytics
      super_tenant: {
        can_manage_users: false,
        can_view_all_requests: true,         // ✅ See all requests
        can_assign_requests: false,          // ❌ Cannot assign
        can_configure_sla: false,
        can_view_analytics: true,            // ✅ View analytics
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,    // ✅ See vendor performance
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: true,     // ✅ Create requests like tenant
        can_configure_auto_assign: false,
      },
      vendor: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      // Food vendor role - MINIMAL permissions for POS only
      food_vendor: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
        // POS-specific permissions
        can_access_pos: true,
        can_process_payments: true,
        can_view_own_orders: true,
        can_print_receipts: true,
      },
      // Procurement Manager - Full procurement access
      procurement_manager: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: true,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
        // Procurement-specific permissions
        can_manage_requisitions: true,
        can_approve_purchase_orders: true,
        can_view_procurement_reports: true,
      },
      // Purchase Executive - Limited procurement access
      purchase_executive: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
        // Procurement-specific permissions
        can_manage_requisitions: true,
        can_approve_purchase_orders: false,
        can_view_procurement_reports: false,
      },
      // Property Manager - Can create requisitions
      property_manager: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
        // Procurement-specific permissions
        can_manage_requisitions: true,
        can_approve_purchase_orders: false,
        can_view_procurement_reports: true,
      },
    };

    // For food vendors, use food_vendor permissions regardless of their role
    const permissionKey = category === 'food_vendor' ? 'food_vendor' : role;
    setPermissions(rolePermissions[permissionKey as keyof typeof rolePermissions] || {});
  }, []);

  const checkUserRole = React.useCallback(async (userId: string): Promise<void> => {
    try {
      console.log('[AuthProvider] checkUserRole started for:', userId);
      
      // Fetch ALL roles from user_roles table (may have duplicates from legacy data)
      const { data: userRolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      // Fetch profile data for other fields
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_category, department, approval_status')
        .eq('id', userId)
        .maybeSingle();
      
      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      // Role priority map - higher = more privileged (defense in depth for duplicate roles)
      const rolePriority: Record<string, number> = {
        'super_admin': 100, 'admin': 90, 'super_tenant': 80,
        'assistant_general_manager': 75, 'assistant_vice_president': 75,
        'vp': 70, 'ceo': 70, 'cxo': 70, 'ops_supervisor': 65,
        'assistant_manager': 60, 'assistant_floor_manager': 60,
        'procurement_manager': 55, 'purchase_executive': 50,
        'property_manager': 45, 'fe': 40, 'mst': 35, 'hk': 35,
        'staff': 30, 'vendor': 25, 'food_vendor': 20,
        'tenant_manager': 15, 'tenant': 10
      };
      
      // Select highest priority role if user has multiple
      let role = 'tenant';
      if (userRolesData && userRolesData.length > 0) {
        const sortedRoles = userRolesData
          .map(r => r.role as string)
          .sort((a, b) => (rolePriority[b] || 0) - (rolePriority[a] || 0));
        role = sortedRoles[0] || 'tenant';
        console.log('[AuthProvider] User roles found:', userRolesData.map(r => r.role), '-> Selected highest priority:', role);
      } else {
        console.log('[AuthProvider] No roles found, defaulting to tenant');
      }
      
      if (profile) {
        updateRoleStates(role, profile.user_category || 'tenant', null);
        setUserDepartment(profile.department || null);
        setApprovalStatus(profile.approval_status || 'pending');
      } else if (userRolesData && userRolesData.length > 0) {
        // Role exists but no profile - create profile
        updateRoleStates(role, 'tenant', null);
        setUserDepartment(null);
        setApprovalStatus('pending');
      } else {
        // No role found in user_roles - create default tenant role
        try {
          // Insert role into user_roles table (authoritative source)
          const { error: roleInsertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'tenant'
            });
          
          if (roleInsertError) {
            console.error('Role creation failed:', roleInsertError);
          }
          
          // Create profile without role column (roles stored in user_roles only)
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              first_name: '',
              last_name: '',
              user_category: 'tenant',
              approval_status: 'pending'
            });
          
          if (profileInsertError) {
            console.error('Profile creation failed:', profileInsertError);
          }
          
          updateRoleStates('tenant', 'tenant');
          setUserDepartment(null);
          setApprovalStatus('pending');
        } catch (createError) {
          console.error('Profile/role creation exception:', createError);
          updateRoleStates('tenant', 'tenant');
          setUserDepartment(null);
          setApprovalStatus('pending');
        }
      }
      
      console.log('[AuthProvider] checkUserRole completed, role set to:', role);
    } catch (error) {
      console.error('Critical error in checkUserRole:', error);
      updateRoleStates('tenant', 'tenant');
      setUserDepartment(null);
      setApprovalStatus('pending');
    }
  }, [updateRoleStates]);

  const resetRoleStates = () => {
    setUserRole(null);
    setUserCategory(null);
    setUserDepartment(null);
    setDepartmentSpecialization(null);
    setApprovalStatus(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsStaff(false);
    setIsTenant(false);
    setIsVendor(false);
    setIsFoodVendor(false);
    setIsFieldExpert(false);
    setIsProcurementStaff(false);
    setIsL1(false);
    setIsL2(false);
    setIsL3(false);
    setIsL4(false);
    setIsManagement(false);
    setPermissions({});
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Handle toasts synchronously
        if (event === 'SIGNED_IN') {
          toast("Welcome back!", {
            description: "You have successfully logged in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast("Signed out", {
            description: "You have been signed out successfully.",
          });
          resetRoleStates();
        }
        
        // Update state synchronously
        setSession(session);
        setUser(session?.user ?? null);
        
        // CRITICAL: Use setTimeout(0) to defer async operations and avoid auth deadlock
        if (session?.user) {
          const userId = session.user.id;
          setTimeout(async () => {
            if (mounted) {
              console.log('[AuthProvider] onAuthStateChange - checking role for user');
              await checkUserRole(userId);
              if (mounted) {
                console.log('[AuthProvider] onAuthStateChange - role check complete, setting isLoading=false');
                setIsLoading(false);
              }
            }
          }, 0);
        } else if (mounted) {
          setIsLoading(false);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (!error && session?.user) {
            setSession(session);
            setUser(session.user);
            await checkUserRole(session.user.id);
          } else {
            resetRoleStates();
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          resetRoleStates();
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserRole]);

  // Real-time subscription for profile updates (instant approval reflection)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as any;
          
          // Update approval status immediately
          if (newProfile.approval_status && newProfile.approval_status !== approvalStatus) {
            setApprovalStatus(newProfile.approval_status);
            
            if (newProfile.approval_status === 'approved') {
              toast('Account Approved!', {
                description: 'Your account has been approved. You now have full access.',
              });
            }
          }
          
          // SECURITY: Fetch role from user_roles, not profiles
          if (user?.id) {
            setTimeout(async () => {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();
              
              if (roleData) {
                updateRoleStates(
                  roleData.role,
                  newProfile.user_category || 'tenant',
                  newProfile.specialization
                );
              }
            }, 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, approvalStatus, updateRoleStates]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      toast("Error signing out", {
        description: error.message,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userRole, 
      userCategory,
      userDepartment,
      departmentSpecialization,
      approvalStatus,
      isAdmin,
      isSuperAdmin,
      isStaff, 
      isTenant,
      isVendor,
      isFoodVendor,
      isFieldExpert,
      isProcurementStaff,
      isL1,
      isL2,
      isL3,
      isL4,
      isManagement,
      permissions,
      isLoading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
