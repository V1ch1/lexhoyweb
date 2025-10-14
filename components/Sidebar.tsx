"use client"; // Asegúrate de que este archivo sea un componente del cliente

import { useRouter, usePathname } from "next/navigation";
import {
  HomeIcon,
  ClipboardIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // Si no hay usuario, no mostrar el sidebar
  if (!user) {
    return null;
  }

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-semibold mb-6">LexHoy Leads</h2>
        <nav>
          <ul className="space-y-1">
            {/* Dashboard - Visible para todos */}
            <li>
              <button
                onClick={() => handleNavigation("/dashboard")}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard" 
                    ? "bg-gray-700 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
            </li>

            {/* Despachos - Visible para todos los usuarios */}
            <li>
              <button
                onClick={() => handleNavigation("/dashboard/despachos")}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard/despachos" 
                    ? "bg-gray-700 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                <span>Despachos</span>
              </button>
            </li>

            {/* Leads - Solo para despacho_admin y super_admin */}
            {(user.role === "despacho_admin" || user.role === "super_admin") && (
              <li>
                <button
                  onClick={() => handleNavigation("/dashboard/leads")}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/dashboard/leads" 
                      ? "bg-gray-700 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <ClipboardIcon className="h-5 w-5" />
                  <span>Leads</span>
                </button>
              </li>
            )}

            {/* Usuarios - Solo para super_admin */}
            {user.role === "super_admin" && (
              <li>
                <button
                  onClick={() => handleNavigation("/admin/users")}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/admin/users" 
                      ? "bg-gray-700 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Usuarios</span>
                </button>
              </li>
            )}

            {/* Configuración - Visible para todos */}
            <li>
              <button
                onClick={() => handleNavigation("/dashboard/settings")}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard/settings" 
                    ? "bg-gray-700 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <CogIcon className="h-5 w-5" />
                <span>Configuración</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
