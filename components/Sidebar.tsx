"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  HomeIcon,
  ClipboardIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
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
            {/* MENÚ PARA SUPER ADMIN */}
            {user.role === "super_admin" ? (
              <>
                {/* Dashboard Admin */}
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/admin")}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname === "/dashboard/admin"
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <HomeIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm">Dashboard Admin</span>
                  </button>
                </li>

                {/* Gestión de Leads */}
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/admin/leads-list")}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/admin/leads")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <ClipboardIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm">Gestión de Leads</span>
                  </button>
                </li>

                {/* Gestión de Usuarios */}
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/admin/users")}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/admin/users")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm">Gestión de Usuarios</span>
                  </button>
                </li>

                {/* Despachos */}
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
                    <span className="font-playfair text-sm">Despachos</span>
                  </button>
                </li>

                {/* Gestión de Marketing (placeholder por ahora) */}
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/admin/marketing")}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/admin/marketing")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <MegaphoneIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm">Gestión de Marketing</span>
                  </button>
                </li>

                {/* Configuración */}
                <li className="mt-8">
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
              </>
            ) : (
              <>
                {/* MENÚ PARA DESPACHO ADMIN Y USUARIOS NORMALES */}
                
                {/* Dashboard */}
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

                {/* Despachos */}
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

                {/* Leads - Para TODOS los usuarios */}
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

                {/* Marketing - Para TODOS los usuarios */}
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/marketing")}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/marketing")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <MegaphoneIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm">Marketing</span>
                  </button>
                </li>


                {/* Configuración */}
                <li className="mt-8">
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
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
