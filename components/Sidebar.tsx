"use client"; // Asegúrate de que este archivo sea un componente del cliente

import { useRouter, usePathname } from "next/navigation";
import { HomeIcon, ClipboardIcon, CogIcon, UserGroupIcon, BuildingOfficeIcon } from "@heroicons/react/24/solid"; // Usando ClipboardIcon
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
        <ul>
          <li>
            <button
              onClick={() => handleNavigation('/dashboard')}
              className={`w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
                pathname === '/dashboard' ? 'bg-gray-700' : ''
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </button>
          </li>
          
          {/* Despachos - Solo para despacho_admin y super_admin */}
          {(user.role === 'despacho_admin' || user.role === 'super_admin') && (
            <li>
              <button
                onClick={() => handleNavigation('/dashboard/despachos')}
                className={`w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
                  pathname === '/dashboard/despachos' ? 'bg-gray-700' : ''
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5" />
                Despachos
              </button>
            </li>
          )}
          
          {/* Leads - Solo para despacho_admin y super_admin */}
          {(user.role === 'despacho_admin' || user.role === 'super_admin') && (
            <li>
              <button
                onClick={() => handleNavigation('/dashboard/leads')}
                className={`w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
                  pathname === '/dashboard/leads' ? 'bg-gray-700' : ''
                }`}
              >
                <ClipboardIcon className="h-5 w-5" />
                Leads
              </button>
            </li>
          )}
          
          {/* Administración - Solo para super_admin */}
          {user.role === 'super_admin' && (
            <li>
              <button
                onClick={() => handleNavigation('/admin/users')}
                className={`w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
                  pathname === '/admin/users' ? 'bg-gray-700' : ''
                }`}
              >
                <UserGroupIcon className="h-5 w-5" />
                Administración
              </button>
            </li>
          )}
          
          <li>
            <button
              onClick={() => handleNavigation('/dashboard/settings')}
              className={`w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 ${
                pathname === '/dashboard/settings' ? 'bg-gray-700' : ''
              }`}
            >
              <CogIcon className="h-5 w-5" />
              Configuración
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
