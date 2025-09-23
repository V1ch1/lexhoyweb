'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, AuthUser } from './authService';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'despacho_admin' | 'usuario';
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
        console.log('🔄 AuthContext: Loading session...');
        setIsLoading(true);
        
        // Timeout de seguridad más largo para evitar pérdida de sesión
        const timeoutId = setTimeout(() => {
          console.log('⏰ AuthContext: Session loading timeout, setting isLoading to false');
          setIsLoading(false);
        }, 15000); // 15 segundos máximo
        
        // Verificar si hay una sesión activa en Supabase
        const currentUserResult = await AuthService.getCurrentUser();
        console.log('👤 AuthContext: getCurrentUser result:', currentUserResult);
        
        // Limpiar timeout si la operación termina antes
        clearTimeout(timeoutId);
        
        if (currentUserResult.user) {
          const userData: User = {
            id: currentUserResult.user.id,
            email: currentUserResult.user.email,
            name: currentUserResult.user.name,
            role: currentUserResult.user.role as 'super_admin' | 'despacho_admin' | 'usuario'
          };
          console.log('✅ AuthContext: Setting user data:', userData);
          setUser(userData);
          
          // Guardar en localStorage como backup
          localStorage.setItem('lexhoy_user', JSON.stringify(userData));
        } else {
          console.log('❌ AuthContext: No user found or error:', currentUserResult.error);
          
          // Intentar recuperar desde localStorage como fallback
          const storedUser = localStorage.getItem('lexhoy_user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              console.log('🔄 AuthContext: Recovered user from localStorage:', userData);
              setUser(userData);
            } catch (e) {
              console.error('❌ AuthContext: Error parsing stored user:', e);
              localStorage.removeItem('lexhoy_user');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('💥 AuthContext: Error loading session:', error);
        
        // Intentar recuperar desde localStorage en caso de error
        const storedUser = localStorage.getItem('lexhoy_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('🔄 AuthContext: Recovered user from localStorage after error:', userData);
            setUser(userData);
          } catch (e) {
            console.error('❌ AuthContext: Error parsing stored user after error:', e);
            localStorage.removeItem('lexhoy_user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        console.log('⏹️ AuthContext: Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadSession();

    // Escuchar cambios en el estado de autenticación
    const subscription = AuthService.onAuthStateChange((authUser: AuthUser | null) => {
      console.log('🔔 AuthContext: Auth state changed:', authUser);
      if (authUser) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          role: authUser.role as 'super_admin' | 'despacho_admin' | 'usuario'
        };
        console.log('✅ AuthContext: Setting user from auth change:', userData);
        setUser(userData);
      } else {
        console.log('❌ AuthContext: Clearing user from auth change');
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
    // Guardar en localStorage como backup
    localStorage.setItem('lexhoy_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      // Limpiar localStorage
      localStorage.removeItem('lexhoy_user');
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar logout local aunque falle el logout remoto
      setUser(null);
      localStorage.removeItem('lexhoy_user');
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
export function useRequireAuth(requiredRole?: 'super_admin' | 'despacho_admin' | 'usuario') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // Si requiere super_admin pero es despacho_admin o usuario, redirigir a su dashboard
        if (requiredRole === 'super_admin' && (user.role === 'despacho_admin' || user.role === 'usuario')) {
          router.push('/dashboard');
          return;
        }
        
        // Si requiere despacho_admin pero es solo usuario, redirigir a dashboard
        if (requiredRole === 'despacho_admin' && user.role === 'usuario') {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [user, isLoading, requiredRole, router]);

  return { user, isLoading };
}