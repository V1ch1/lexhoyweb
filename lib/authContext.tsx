'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, AuthUser } from './authService';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'despacho_admin';
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar sesión al iniciar
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        
        // Verificar si hay una sesión activa en Supabase
        const currentUserResult = await AuthService.getCurrentUser();
        
        if (currentUserResult.user) {
          const userData: User = {
            id: currentUserResult.user.id,
            email: currentUserResult.user.email,
            name: currentUserResult.user.name,
            role: currentUserResult.user.role as 'super_admin' | 'despacho_admin'
          };
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Escuchar cambios en el estado de autenticación
    const subscription = AuthService.onAuthStateChange((authUser: AuthUser | null) => {
      if (authUser) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          role: authUser.role as 'super_admin' | 'despacho_admin'
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup del listener
    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const login = (userData: User) => {
    // El login real se maneja en AuthService.signIn
    // Este método solo actualiza el estado local
    setUser(userData);
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar logout local aunque falle el logout remoto
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para proteger rutas
export function useRequireAuth(requiredRole?: 'super_admin' | 'despacho_admin') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // Si requiere super_admin pero es despacho_admin, redirigir a su dashboard
        if (requiredRole === 'super_admin' && user.role === 'despacho_admin') {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [user, isLoading, requiredRole, router]);

  return { user, isLoading };
}