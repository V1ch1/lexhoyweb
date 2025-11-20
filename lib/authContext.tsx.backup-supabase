"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthSimpleService } from "./auth/services/auth-simple.service";

interface User {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "despacho_admin" | "usuario";
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => boolean;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar sesión al iniciar - SOLO UNA VEZ
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;
    
    const loadSession = async () => {
      try {
        // Cargar desde localStorage PRIMERO
        const storedUser = localStorage.getItem("lexhoy_user");
        if (storedUser && mounted) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (e) {
            console.error("❌ Error al parsear usuario de localStorage:", e);
          }
        }
        
        // IMPORTANTE: Marcar como completado INMEDIATAMENTE
        // No esperamos a la verificación del servidor para no bloquear la UI
        if (mounted) {
          setIsLoading(false);
        }
        
        // Verificar la sesión con el servidor en segundo plano (opcional)
        // Esto no bloquea la UI
        AuthSimpleService.getCurrentUser().then(response => {
          if (!mounted) return;
          
          if (response.error || !response.user) {
            setUser(null);
            localStorage.removeItem("lexhoy_user");
            return;
          }
          
          // Actualizar el usuario con los datos del servidor (incluye rol de la tabla users)
          const userData: User = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role
          };
          
          setUser(userData);
          localStorage.setItem("lexhoy_user", JSON.stringify(userData));
        }).catch(error => {
          console.error("⚠️ Error al verificar sesión con servidor (no crítico):", error);
        });
        
      } catch (error) {
        console.error("💥 Error cargando sesión:", error);
        // En caso de error, mantener el usuario de localStorage si existe
        const storedUser = localStorage.getItem("lexhoy_user");
        if (storedUser && mounted) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            } catch (e) {
            console.error("❌ Error al analizar el usuario guardado:", e);
            setUser(null);
            localStorage.removeItem("lexhoy_user");
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    // Escuchar cambios en el estado de autenticación
    unsubscribe = AuthSimpleService.onAuthStateChange((event: string, session: unknown) => {
      if (!mounted) return;
      
      // Solo actualizar el estado si es un evento de cierre de sesión
      // Los eventos SIGNED_IN se manejan manualmente en el componente de login
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        const sessionData = session as { user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null;
        if (sessionData?.user) {
          const userData: User = {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            name: (sessionData.user.user_metadata?.name as string) || '',
            role: (sessionData.user.user_metadata?.role as "super_admin" | "despacho_admin" | "usuario") || 'usuario',
          };
          setUser(userData);
          localStorage.setItem("lexhoy_user", JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem("lexhoy_user");
        }
      }
    });

    // Cleanup del listener
    return () => {
      mounted = false;
      // Llamar a la función de desuscripción si existe
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // ⚠️ IMPORTANTE: Array vacío para que solo se ejecute UNA VEZ al montar

  const login = (userData: User): boolean => {
    try {
      // Validar datos del usuario
      if (!userData || !userData.id || !userData.email) {
        console.error("❌ Datos de usuario inválidos:", userData);
        return false;
      }
      
      // Actualizar el estado local
      setUser(userData);
      
      // Guardar en localStorage como backup
      localStorage.setItem("lexhoy_user", JSON.stringify(userData));
      localStorage.setItem("isAuthenticated", "true");
      
      return true;
    } catch (error) {
      console.error("❌ Error en la función login:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await AuthSimpleService.logout();
      
      if (error) {
        console.error("Error al cerrar sesión:", error);
      }
      
      setUser(null);
      localStorage.removeItem("lexhoy_user");
      router.push("/login");
    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error);
      // Forzar logout local aunque falle el logout remoto
      setUser(null);
      localStorage.removeItem("lexhoy_user");
      router.push("/login");
    }
  };
  
  // Alias para mantener compatibilidad
  const logout = handleLogout;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook para proteger rutas
export function useRequireAuth(
  requiredRole?: "super_admin" | "despacho_admin" | "usuario"
) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Páginas públicas que no requieren autenticación
  const publicPages = [
    "/",
    "/sobre-nosotros",
    "/servicios",
    "/contacto",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/confirm",
    "/test",
    "/diagnostic",
  ];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    // DESHABILITADO TEMPORALMENTE: Evitar redirects automáticos entre dashboard/admin
    // Esto estaba causando recargas de página al navegar entre secciones
    // if (!isLoading && !isPublicPage) {
    //   if (!user) {
    //     //     router.push('/login');
    //     return;
    //   }

    //   if (requiredRole && user.role !== requiredRole) {
    //     // Si requiere super_admin pero es despacho_admin o usuario, redirigir a su dashboard
    //     if (requiredRole === 'super_admin' && (user.role === 'despacho_admin' || user.role === 'usuario')) {
    //       //       router.push('/dashboard');
    //       return;
    //     }

    //     // Si requiere despacho_admin pero es solo usuario, redirigir a dashboard
    //     if (requiredRole === 'despacho_admin' && user.role === 'usuario') {
    //       //       router.push('/dashboard');
    //       return;
    //     }
    //   }
    // }
  }, [user, isLoading, requiredRole, router, pathname, isPublicPage]);

  return { user, isLoading };
}
