import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  userDepartment: string | null;
  departmentSpecialization: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  isAdmin: boolean;
  isStaff: boolean;
  isOpsSupervisor: boolean;
  isFieldStaff: boolean;
  isTenantManager: boolean;
  isTenantUser: boolean;
  isVendor: boolean;
  isSiteManager: boolean;
  isSustainabilityManager: boolean;
  isFinanceAnalyst: boolean;
  isClientReadOnly: boolean;
  isLoading: boolean;
  permissions: Record<string, boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  userDepartment: null,
  departmentSpecialization: null,
  approvalStatus: null,
  isAdmin: false,
  isStaff: false,
  isOpsSupervisor: false,
  isFieldStaff: false,
  isTenantManager: false,
  isTenantUser: false,
  isVendor: false,
  isSiteManager: false,
  isSustainabilityManager: false,
  isFinanceAnalyst: false,
  isClientReadOnly: false,
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
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [departmentSpecialization, setDepartmentSpecialization] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isOpsSupervisor, setIsOpsSupervisor] = useState(false);
  const [isFieldStaff, setIsFieldStaff] = useState(false);
  const [isTenantManager, setIsTenantManager] = useState(false);
  const [isTenantUser, setIsTenantUser] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isSiteManager, setIsSiteManager] = useState(false);
  const [isSustainabilityManager, setIsSustainabilityManager] = useState(false);
  const [isFinanceAnalyst, setIsFinanceAnalyst] = useState(false);
  const [isClientReadOnly, setIsClientReadOnly] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const updateRoleStates = React.useCallback((role: string, specialization?: string) => {
    setUserRole(role);
    setDepartmentSpecialization(specialization || null);
    setIsAdmin(role === 'admin');
    setIsOpsSupervisor(role === 'ops_supervisor');
    setIsFieldStaff(role === 'field_staff');
    setIsTenantManager(role === 'tenant_manager');
    setIsTenantUser(role === 'tenant_user');
    setIsVendor(role === 'vendor');
    setIsSiteManager(role === 'site_manager');
    setIsSustainabilityManager(role === 'sustain_mgr');
    setIsFinanceAnalyst(role === 'fin_analyst');
    setIsClientReadOnly(role === 'client_readonly');
    setIsStaff(['admin', 'ops_supervisor', 'field_staff', 'site_manager'].includes(role));

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
      ops_supervisor: {
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
      site_manager: {
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
      },
      field_staff: {
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
      tenant_manager: {
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
      tenant_user: {
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
      fin_analyst: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: true,
        can_manage_green_kpis: false,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      sustain_mgr: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
        can_view_vendor_scorecards: false,
        can_manage_green_kpis: true,
        can_use_qr_instant_ticket: false,
        can_configure_auto_assign: false,
      },
      client_readonly: {
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
      },
    };

    setPermissions(rolePermissions[role as keyof typeof rolePermissions] || {});
  }, []);

  const checkUserRole = React.useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, department, department_specialization, approval_status')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        updateRoleStates('tenant_user');
        setUserDepartment(null);
        setApprovalStatus('pending');
        return;
      }
      
      if (profile) {
        updateRoleStates(profile.role, profile.department_specialization);
        setUserDepartment(profile.department || null);
        setApprovalStatus(profile.approval_status || 'pending');
      } else {
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              first_name: '',
              last_name: '',
              role: 'tenant_user',
              approval_status: 'pending'
            });
          
          if (insertError) {
            console.error('Profile creation failed:', insertError);
          }
          
          updateRoleStates('tenant_user');
          setUserDepartment(null);
          setApprovalStatus('pending');
        } catch (createError) {
          console.error('Profile creation exception:', createError);
          updateRoleStates('tenant_user');
          setUserDepartment(null);
          setApprovalStatus('pending');
        }
      }
    } catch (error) {
      console.error('Critical error in checkUserRole:', error);
      updateRoleStates('tenant_user');
      setUserDepartment(null);
      setApprovalStatus('pending');
    }
  }, [updateRoleStates]);

  const resetRoleStates = () => {
    setUserRole(null);
    setUserDepartment(null);
    setDepartmentSpecialization(null);
    setApprovalStatus(null);
    setIsAdmin(false);
    setIsStaff(false);
    setIsOpsSupervisor(false);
    setIsFieldStaff(false);
    setIsTenantManager(false);
    setIsTenantUser(false);
    setIsVendor(false);
    setIsSiteManager(false);
    setIsSustainabilityManager(false);
    setIsFinanceAnalyst(false);
    setIsClientReadOnly(false);
    setPermissions({});
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

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
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && mounted) {
          setTimeout(() => checkUserRole(session.user.id), 0);
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
      userDepartment,
      departmentSpecialization,
      approvalStatus,
      isAdmin, 
      isStaff, 
      isOpsSupervisor,
      isFieldStaff,
      isTenantManager,
      isTenantUser,
      isVendor,
      isSiteManager,
      isSustainabilityManager,
      isFinanceAnalyst,
      isClientReadOnly,
      permissions,
      isLoading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
