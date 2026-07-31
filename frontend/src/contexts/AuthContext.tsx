import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginSuccess: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  token: string | null;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('kymira_access_token');
    if (token) {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem('kymira_access_token');
        localStorage.removeItem('kymira_refresh_token');
      }
    }
    setIsLoading(false);
  };

  // Validate stored token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const loginSuccess = (newUser: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('kymira_access_token', accessToken);
    localStorage.setItem('kymira_refresh_token', refreshToken);
    setUser(newUser);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('kymira_refresh_token') || '';
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore logout errors — clear locally regardless
    }
    localStorage.removeItem('kymira_access_token');
    localStorage.removeItem('kymira_refresh_token');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginSuccess,
        logout,
        updateUser,
        token: localStorage.getItem('kymira_access_token'),
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
