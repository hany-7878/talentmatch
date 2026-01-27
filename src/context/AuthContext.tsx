import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AuthContextType } from '../types'; 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimized Profile Fetcher
  const refreshProfile = useCallback(async (userId?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 

      if (error) throw error;
      
      if (data) {
        setProfile(data as Profile);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Single source of truth for auth state handling
    const handleAuthState = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        // We wait for the profile before unlocking the UI
        await refreshProfile(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    };

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleAuthState(s);
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      handleAuthState(s);
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, logout, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};