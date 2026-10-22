'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: { nome: string; email: string; telefone?: string; senha: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const userData = await api.me();
          setUser(userData);
        } catch {
          api.clearAuth();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    const data = await api.login(email, senha);
    setUser(data.usuario);
  };

  const register = async (data: { nome: string; email: string; telefone?: string; senha: string }) => {
    const result = await api.register(data);
    setUser(result.usuario);
  };

  const logout = () => {
    api.clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    if (api.isAuthenticated()) {
      try {
        const userData = await api.me();
        setUser(userData);
      } catch {
        api.clearAuth();
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}