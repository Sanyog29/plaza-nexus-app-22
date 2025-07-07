import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  isOpsSupervisor: boolean;
  isFieldStaff: boolean;
  isTenantManager: boolean;
  isVendor: boolean;
  isLoading: boolean;
  permissions: Record<string, boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isAdmin: false,
  isStaff: false,
  isOpsSupervisor: false,
  isFieldStaff: false,
  isTenantManager: false,
  isVendor: false,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isOpsSupervisor, setIsOpsSupervisor] = useState(false);
  const [isFieldStaff, setIsFieldStaff] = useState(false);
  const [isTenantManager, setIsTenantManager] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const updateRoleStates = (role: string) => {
    setUserRole(role);
    setIsAdmin(role === 'admin');
    setIsOpsSupervisor(role === 'ops_supervisor');
    setIsFieldStaff(role === 'field_staff');
    setIsTenantManager(role === 'tenant_manager');
    setIsVendor(role === 'vendor');
    setIsStaff(['admin', 'ops_supervisor', 'field_staff'].includes(role));

    // Set permissions based on role
    const rolePermissions = {
      admin: {
        can_manage_users: true,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: true,
        can_view_analytics: true,
        can_manage_vendors: true,
      },
      ops_supervisor: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
      },
      field_staff: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      },
      tenant_manager: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      },
      vendor: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      },
    };

    setPermissions(rolePermissions[role as keyof typeof rolePermissions] || {});
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // User-friendly error handling instead of console.error
        updateRoleStates('tenant_manager');
        return;
      }
      
      if (profile) {
        updateRoleStates(profile.role);
      } else {
        updateRoleStates('tenant_manager');
      }
    } catch (error) {
      // Graceful error handling
      updateRoleStates('tenant_manager');
    }
  };

  const resetRoleStates = () => {
    setUserRole(null);
    setIsAdmin(false);
    setIsStaff(false);
    setIsOpsSupervisor(false);
    setIsFieldStaff(false);
    setIsTenantManager(false);
    setIsVendor(false);
    setPermissions({});
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Handle auth events
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
        
        // Handle role checking separately
        if (session?.user && mounted) {
          setTimeout(() => checkUserRole(session.user.id), 0);
        } else if (mounted) {
          setIsLoading(false);
        }
      }
    );

    // Initialize auth state AFTER setting up listener
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (!error && session) {
            setSession(session);
            setUser(session.user);
            if (session.user) {
              await checkUserRole(session.user.id);
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      isAdmin, 
      isStaff, 
      isOpsSupervisor,
      isFieldStaff,
      isTenantManager,
      isVendor,
      permissions,
      isLoading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};