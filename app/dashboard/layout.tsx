"use client"; // Indica que este es un componente del cliente

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import Sidebar from "@/components/Sidebar"; // Sidebar del Dashboard
import NavbarDashboard from "@/components/NavbarDashboard"; // Navbar del Dashboard

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, intentar recuperar de localStorage o redirigir
  if (!user) {
    // Intentar recuperar usuario de localStorage
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("lexhoy_user");
      if (!storedUser) {
        // No hay usuario guardado, usar Next.js router
        router.push("/login");
        return null;
      }
    }
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar del Dashboard */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Navbar específico para el Dashboard */}
        <NavbarDashboard />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
