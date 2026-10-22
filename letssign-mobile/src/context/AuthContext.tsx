import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<AuthResponse>;
  register: (data: { nome: string; email: string; telefone?: string; senha: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        api.getToken(),
        api.getUser(),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Erro ao carregar auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    const response = await api.login(email, senha);
    await api.setAuthToken(response.accessToken, response.usuario);
    setToken(response.accessToken);
    setUser(response.usuario);
    return response;
  };

  const register = async (data: { nome: string; email: string; telefone?: string; senha: string }) => {
    const response = await api.register(data);
    await api.setAuthToken(response.accessToken, response.usuario);
    setToken(response.accessToken);
    setUser(response.usuario);
    return response;
  };

  const logout = async () => {
    await api.clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated: !!token,
      }}
    >
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