import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '@/integrations/api/types';
import { apiClient } from '@/integrations/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiClient.login(email, password);
      setUser(response.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { error: error.message || 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiClient.register(email, password);
      setUser(response.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign up failed:', error);
      return { error: error.message || 'Sign up failed' };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}