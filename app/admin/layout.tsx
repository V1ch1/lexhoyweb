"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/authContext";
import Sidebar from "@/components/Sidebar";
import NavbarDashboard from "@/components/NavbarDashboard";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar acceso denegado si ya terminó de cargar y el usuario no tiene el rol adecuado
  if (!user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección.
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
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
