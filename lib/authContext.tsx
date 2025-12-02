/**
 * Hook adaptador para migración a NextAuth
 * Mantiene compatibilidad con código existente que usa useAuth()
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  nombre?: string;
  apellidos?: string;
  role?: "super_admin" | "despacho_admin" | "usuario";
  rol?: "super_admin" | "despacho_admin" | "usuario";
  telefono?: string;
  localidad?: string;
  provincia?: string;
  plan?: string;
  activo?: boolean;
  despacho_id?: string;
  fecha_registro?: string;
  ultimo_acceso?: string;
  image?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user: User | null = useMemo(() => {
    return session?.user ? {
      id: session.user.id || "",
      email: session.user.email || "",
      name: session.user.name || "",
      image: session.user.image || "",
      // @ts-ignore
      role: session.user.rol || "usuario",
      // @ts-ignore
      rol: session.user.rol || "usuario",
      // @ts-ignore
      plan: session.user.plan,
      // @ts-ignore
      activo: session.user.activo,
    } : null;
  }, [session]);

  return {
    user,
    isLoading,
    isAuthenticated,
    // Deprecated but kept for compatibility
    login: (payload?: any) => {
      console.warn("useAuth.login is deprecated. NextAuth handles session automatically.");
      return true;
    },
    logout: () => signOut({ callbackUrl: "/login" }),
  };
}

// Mantener compatibilidad con AuthProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hook useRequireAuth para compatibilidad
export function useRequireAuth(requiredRole?: string) {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
