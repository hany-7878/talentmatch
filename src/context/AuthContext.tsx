import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types'; 

/**
 * SENIOR REFACTOR: Define the interface explicitly to resolve the 'AuthContextType' error.
 * This ensures TypeScript knows exactly what the Context provides.
 */
export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * REFRESH PROFILE
   * Fixes the 400 Bad Request (id=eq.undefined)
   */
  const refreshProfile = useCallback(async (userId?: string): Promise<Profile | null> => {
    // Determine which ID to use: explicitly passed param > current state user > session user
    const targetId = userId || user?.id;

    if (!targetId || targetId === 'undefined') {
      console.warn("[AuthContext] refreshProfile blocked: Target ID is null or undefined.");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle(); 

      if (error) throw error;
      
      if (data) {
        const profileData = data as Profile;
        setProfile(profileData);
        return profileData;
      }
      return null;
    } catch (err) {
      console.error("[AuthContext] Profile Fetch Error:", err);
      return null;
    }
  }, [user?.id]); // Re-memoize when user ID changes

  /**
   * AUTH STATE HANDLER
   * Consolidates session management and profile fetching.
   */
  const handleAuthState = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      setSession(currentSession);
      setUser(currentSession.user);
      // Ensure we have the profile before we stop the loading spinner
      await refreshProfile(currentSession.user.id);
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
    setIsLoading(false);
  }, [refreshProfile]);

  useEffect(() => {
    // 1. INITIAL CHECK
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleAuthState(s);
    });

    // 2. Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      handleAuthState(s);
    });

    return () => subscription.unsubscribe();
  }, [handleAuthState]);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const contextValue = useMemo(() => ({
    user,
    profile,
    session,
    isLoading,
    logout,
    refreshProfile
  }), [user, profile, session, isLoading, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};