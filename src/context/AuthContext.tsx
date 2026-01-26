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

  const refreshProfile = useCallback(async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      // maybeSingle() prevents the app from crashing if the profile 
      // row hasn't been created yet by a database trigger.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle(); 

      if (error) throw error;
      
      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    } finally {
      // Ensure we stop the loading spinner regardless of success or failure
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await refreshProfile(initialSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await refreshProfile(currentUser.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }

      // Special handling for sign out to ensure clean state
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
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