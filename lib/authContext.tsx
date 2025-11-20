/**
 * Hook adaptador para migración de Supabase Auth a Clerk
 * Mantiene compatibilidad con código existente que usa useAuth()
 */

"use client";

import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  id: string;
  email: string;
  name?: string;
  nombre?: string;
  apellidos?: string;
  role?: "super_admin" | "despacho_admin" | "usuario";
  rol?: "super_admin" | "despacho_admin" | "usuario";
  plan?: string;
  activo?: boolean;
  despacho_id?: string;
  fecha_registro?: string;
  ultimo_acceso?: string;
}

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!isLoaded) {
        setIsLoading(true);
        return;
      }

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Obtener datos del usuario desde Supabase usando Clerk ID
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", clerkUser.id)
          .single();

        if (error) {
          console.error("Error fetching user from Supabase:", error);
          // Si no existe en Supabase, crear un usuario básico con datos de Clerk
          setUser({
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            role: "usuario",
          });
        } else {
          // Normalizar campos para compatibilidad
          const normalizedUser = {
            ...data,
            name: data.nombre || data.name,
            role: data.rol || data.role,
          } as User;
          console.log('🔍 User data from Supabase:', data);
          console.log('🔍 Normalized user:', normalizedUser);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error("Error in useAuth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [clerkUser, isSignedIn, isLoaded]);

  return {
    user,
    isLoading,
    isAuthenticated: isSignedIn,
    login: (payload?: Partial<User>) => {
      if (payload) {
        const newUser: User = {
          id: payload.id || "",
          email: payload.email || "",
          name: payload.name || payload.nombre || "",
          nombre: payload.nombre || payload.name || "",
          apellidos: payload.apellidos || "",
          role: (payload.role || payload.rol || "usuario") as User["role"],
          plan: payload.plan,
          activo: payload.activo,
          despacho_id: payload.despacho_id,
          fecha_registro: payload.fecha_registro,
          ultimo_acceso: payload.ultimo_acceso,
        };
        setUser(newUser);
      }
      return true;
    },
    logout: () => {
      setUser(null);
    },
  };
}

// Mantener compatibilidad con AuthProvider (no hace nada ahora, Clerk maneja todo)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hook useRequireAuth para compatibilidad
export function useRequireAuth(requiredRole?: string) {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
