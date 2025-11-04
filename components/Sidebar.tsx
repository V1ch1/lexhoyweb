"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  ClipboardIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [currentHash, setCurrentHash] = useState('');
  const [despachosOpen, setDespachosOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);

  // Detectar cambios en el hash
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash);
    };
    
    // Actualizar al montar
    updateHash();
    
    // Escuchar cambios
    window.addEventListener('hashchange', updateHash);
    
    // Polling como fallback
    const interval = setInterval(updateHash, 100);
    
    return () => {
      window.removeEventListener('hashchange', updateHash);
      clearInterval(interval);
    };
  }, []);

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
        <h2 className="text-3xl font-playfair font-semibold mb-8 text-slate-800 tracking-tight">LexHoy</h2>
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

            {/* Despachos - Con submenú desplegable */}
            <li>
              <div className="mb-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavigation("/dashboard/despachos")}
                    className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-l-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/despachos")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <BuildingOfficeIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm font-semibold">Despachos</span>
                  </button>
                  <button
                    onClick={() => setDespachosOpen(!despachosOpen)}
                    className={`px-2 py-2.5 rounded-r-lg transition-all duration-200 ${
                      pathname.startsWith("/dashboard/despachos")
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {despachosOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Submenú desplegable */}
              {despachosOpen && (
                <ul className="ml-4 space-y-1 border-l-2 border-slate-300 pl-4">
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/despachos")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/despachos"
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Ver despachos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleNavigation("/dashboard/despachos");
                      // Disparar evento para abrir modal de importar
                      setTimeout(() => {
                        const event = new CustomEvent('openImportModal');
                        window.dispatchEvent(event);
                      }, 100);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Importar despacho
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("/dashboard/despachos/crear")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/despachos/crear"
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Alta nuevo despacho
                  </button>
                </li>
              </ul>
              )}
            </li>

            {/* Leads - Solo para despacho_admin y super_admin */}
            {(user.role === "despacho_admin" || user.role === "super_admin") && (
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

            {/* Configuración - Con submenú desplegable */}
            <li>
              <div className="mb-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push("/dashboard/settings")}
                    className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-l-lg transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === ''
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <CogIcon className="h-5 w-5" />
                    <span className="font-playfair text-sm font-semibold">Configuración</span>
                  </button>
                  <button
                    onClick={() => setConfigOpen(!configOpen)}
                    className={`px-2 py-2.5 rounded-r-lg transition-all duration-200 ${
                      pathname === "/dashboard/settings"
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {configOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Submenú desplegable */}
              {configOpen && (
                <ul className="ml-4 space-y-1 border-l-2 border-slate-300 pl-4">
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#perfil")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#perfil'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Perfil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#contrasena")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#contrasena'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Contraseña
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#notificaciones")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#notificaciones'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Notificaciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#mis-despachos")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#mis-despachos'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Mis Despachos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#privacidad")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#privacidad'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Privacidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/dashboard/settings#sesiones")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      pathname === "/dashboard/settings" && currentHash === '#sesiones'
                        ? "text-slate-900 font-medium bg-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Sesiones
                  </button>
                </li>
              </ul>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
