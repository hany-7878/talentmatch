import { createContext, useState, useContext,  useEffect } from 'react';
import type { ReactNode } from 'react'
import { loginUser, logoutUser, refreshToken } from '../services/api';

type AuthContextType = {
  user: any;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const data = await loginUser({ email, password });
    setAccessToken(data.access);
    localStorage.setItem('refreshToken', data.refresh);
    setUser(data.user); // backend should return user info
  };

  const logout = async () => {
    await logoutUser();
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
  };

  // Keep user authenticated across sessions
  useEffect(() => {
    const refresh = async () => {
      const storedRefresh = localStorage.getItem('refreshToken');
      if (storedRefresh) {
        const data = await refreshToken(storedRefresh);
        setAccessToken(data.access);
      }
    };
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
