// components/NavbarDashboard.tsx
"use client";

import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";
import { NotificationBell } from "@/components/NotificationBell";

const NavbarDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-semibold font-playfair">Dashboard</div>

      <div className="flex items-center space-x-4">
        {/* Campana de notificaciones para todos los usuarios */}
        {user && (
          <NotificationBell userId={user.id} userRole={user.role} />
        )}

        {/* Información del usuario */}
        {user && (
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm">
              <div className="font-medium font-playfair">{user.name}</div>
              <div className="text-gray-300">{user.email}</div>
            </div>
          </div>
        )}

        {/* Botón de logout */}
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-playfair"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavbarDashboard;
