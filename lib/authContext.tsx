"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthService, AuthUser } from "./authService";

interface User {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "despacho_admin" | "usuario";
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

  // Cargar sesión al iniciar - SOLO UNA VEZ
  useEffect(() => {
    let mounted = true;
    
    const loadSession = async () => {
      try {
        // Primero intentar cargar desde localStorage (más rápido)
        const storedUser = localStorage.getItem("lexhoy_user");
        if (storedUser && mounted) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log("✅ Usuario cargado desde localStorage:", userData.email);
          } catch (e) {
            console.error("❌ Error parsing stored user:", e);
            localStorage.removeItem("lexhoy_user");
          }
        }

        // Luego verificar con Supabase en segundo plano (sin bloquear UI)
        const currentUserResult = await AuthService.getCurrentUser();

        if (currentUserResult.user && mounted) {
          const userData: User = {
            id: currentUserResult.user.id,
            email: currentUserResult.user.email,
            name: currentUserResult.user.name,
            role: currentUserResult.user.role as
              | "super_admin"
              | "despacho_admin"
              | "usuario",
          };
          setUser(userData);
          localStorage.setItem("lexhoy_user", JSON.stringify(userData));
          console.log("✅ Usuario verificado con Supabase:", userData.email);
        } else if (!storedUser && mounted) {
          // Solo limpiar si no hay usuario en localStorage tampoco
          setUser(null);
        }
      } catch (error) {
        console.error("💥 Error loading session:", error);
        // En caso de error, mantener el usuario de localStorage si existe
        const storedUser = localStorage.getItem("lexhoy_user");
        if (storedUser && mounted) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log("⚠️ Usando usuario de localStorage por error de red");
          } catch (e) {
            console.error("❌ Error parsing stored user after error:", e);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    // Escuchar cambios en el estado de autenticación
    const subscription = AuthService.onAuthStateChange(
      (authUser: AuthUser | null) => {
        if (!mounted) return;
        
        if (authUser) {
          const userData: User = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            role: authUser.role as "super_admin" | "despacho_admin" | "usuario",
          };
          setUser(userData);
          localStorage.setItem("lexhoy_user", JSON.stringify(userData));
          console.log("🔄 Usuario actualizado por auth state change:", userData.email);
        } else {
          // NO limpiar el usuario inmediatamente, verificar localStorage primero
          const storedUser = localStorage.getItem("lexhoy_user");
          if (!storedUser) {
            setUser(null);
            console.log("🚪 Usuario desconectado");
          } else {
            console.log("⚠️ Auth state null pero manteniendo usuario de localStorage");
          }
        }
      }
    );

    // Cleanup del listener
    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []); // ⚠️ IMPORTANTE: Array vacío para que solo se ejecute UNA VEZ al montar

  const login = (userData: User) => {
    // El login real se maneja en AuthService.signIn
    // Este método solo actualiza el estado local
    setUser(userData);
    // Guardar en localStorage como backup
    localStorage.setItem("lexhoy_user", JSON.stringify(userData));
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      await AuthService.signOut();
      setUser(null);
      // Limpiar localStorage
      localStorage.removeItem("lexhoy_user");
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Forzar logout local aunque falle el logout remoto
      setUser(null);
      localStorage.removeItem("lexhoy_user");
      router.push("/login");
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
    console.log(
      "⏸️ useRequireAuth: Redirects automáticos deshabilitados para mejorar navegación SPA"
    );

    // if (!isLoading && !isPublicPage) {
    //   if (!user) {
    //     console.log('🚨 useRequireAuth: No user found, redirecting to login from:', pathname);
    //     router.push('/login');
    //     return;
    //   }

    //   if (requiredRole && user.role !== requiredRole) {
    //     // Si requiere super_admin pero es despacho_admin o usuario, redirigir a su dashboard
    //     if (requiredRole === 'super_admin' && (user.role === 'despacho_admin' || user.role === 'usuario')) {
    //       console.log('🚨 useRequireAuth: Insufficient permissions (super_admin required), redirecting to dashboard');
    //       router.push('/dashboard');
    //       return;
    //     }

    //     // Si requiere despacho_admin pero es solo usuario, redirigir a dashboard
    //     if (requiredRole === 'despacho_admin' && user.role === 'usuario') {
    //       console.log('🚨 useRequireAuth: Insufficient permissions (despacho_admin required), redirecting to dashboard');
    //       router.push('/dashboard');
    //       return;
    //     }
    //   }
    // }
  }, [user, isLoading, requiredRole, router, pathname, isPublicPage]);

  return { user, isLoading };
}
