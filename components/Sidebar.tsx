"use client";

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
    <div className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 h-full flex flex-col shadow-sm">
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-playfair font-semibold mb-8 text-slate-800 tracking-tight">
          LexHoy
        </h2>
        <nav>
          <ul className="space-y-1">
            {/* Dashboard - Visible para todos */}
            <li>
              <button
                onClick={() => handleNavigation("/dashboard")}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  pathname === "/dashboard"
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span className="font-playfair text-sm">Dashboard</span>
              </button>
            </li>

            {/* Despachos - Botón simple sin desplegable */}
            <li>
              <button
                onClick={() => handleNavigation("/dashboard/despachos")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/dashboard/despachos")
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                <span className="font-playfair text-sm font-semibold">
                  Despachos
                </span>
              </button>
            </li>

            {/* Leads - Solo para despacho_admin y super_admin */}
            {(user.role === "despacho_admin" ||
              user.role === "super_admin") && (
              <li>
                <button
                  onClick={() => handleNavigation("/dashboard/leads")}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    pathname === "/dashboard/leads"
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <ClipboardIcon className="h-5 w-5" />
                  <span className="font-playfair text-sm">Leads</span>
                </button>
              </li>
            )}

            {/* Usuarios - Solo para super_admin */}
            {user.role === "super_admin" && (
              <li>
                <button
                  onClick={() => handleNavigation("/admin/users")}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    pathname === "/admin/users"
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  <span className="font-playfair text-sm">Usuarios</span>
                </button>
              </li>
            )}

            {/* Configuración - Botón simple sin desplegable */}
            <li>
              <button
                onClick={() => router.push("/dashboard/settings")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  pathname === "/dashboard/settings"
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <CogIcon className="h-5 w-5" />
                <span className="font-playfair text-sm font-semibold">
                  Configuración
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
