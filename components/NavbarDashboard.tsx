// components/NavbarDashboard.tsx
"use client";

import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";
import { NotificationBell } from "@/components/NotificationBell";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const NavbarDashboard = () => {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-semibold font-playfair">
        Gestión de despachos
      </div>

      <div className="flex items-center space-x-4">
        {/* Campana de notificaciones para todos los usuarios */}
        {user && (
          <NotificationBell userId={user.id} userRole={user.role ?? "usuario"} />
        )}

        {/* Menú de usuario con dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-left">
                <div className="font-medium font-playfair">{user.name}</div>
                <div className="text-gray-300">{user.email}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={() => {
                    router.push("/dashboard/settings");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                  <span>Configuración</span>
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={() => {
                    handleLogout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-600" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarDashboard;
