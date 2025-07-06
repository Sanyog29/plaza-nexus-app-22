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
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isAdmin: false,
  isStaff: false,
  isLoading: true,
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
  const [isLoading, setIsLoading] = useState(true);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUserRole(profile.role);
        setIsAdmin(profile.role === 'admin');
        setIsStaff(['admin', 'staff', 'ops_l1', 'ops_l2'].includes(profile.role));
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('tenant');
      setIsAdmin(false);
      setIsStaff(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          toast("Welcome back!", {
            description: "You have successfully logged in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast("Signed out", {
            description: "You have been signed out successfully.",
          });
          setUserRole(null);
          setIsAdmin(false);
          setIsStaff(false);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          checkUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => {
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
    <AuthContext.Provider value={{ session, user, userRole, isAdmin, isStaff, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
