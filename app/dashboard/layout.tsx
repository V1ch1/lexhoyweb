"use client"; // Indica que este es un componente del cliente

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar"; // Sidebar del Dashboard
import NavbarDashboard from "@/components/NavbarDashboard"; // Navbar del Dashboard

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push("/login"); // Redirige si no está autenticado
    }
  }, [router]);

  if (!isAuthenticated) {
    return <div>Loading...</div>; // Mientras verificamos el estado de autenticación
  }

  return (
    <div className="flex h-screen">
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
