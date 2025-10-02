"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import Sidebar from "@/components/Sidebar";
import NavbarDashboard from "@/components/NavbarDashboard";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Mostrar loading solo si está cargando Y no hay usuario todavía
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, verificar localStorage o mostrar acceso denegado
  if (!user) {
    // Intentar recuperar usuario de localStorage
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("lexhoy_user");
      if (!storedUser) {
        // No hay usuario guardado, redirigir a login
        router.push("/login");
        return null;
      }
    }
    return null;
  }

  // Si el usuario no es super_admin, mostrar acceso denegado
  if (user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            Solo los super administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar unificado */}
      <Sidebar />

      {/* Contenido principal con navbar consistente */}
      <div className="flex-1 flex flex-col">
        {/* Navbar consistente con dashboard */}
        <NavbarDashboard />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
