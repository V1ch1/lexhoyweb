// components/NavbarDashboard.tsx
"use client";

import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/lib/authContext";
import { NotificationBell } from "@/components/NotificationBell";
import { useEffect, useState } from "react";

const NavbarDashboard = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // Eliminada la llamada a /api/solicitudes-despacho?estado=pendiente

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-semibold">Dashboard</div>

      <div className="flex items-center space-x-4">

        {/* Campana de notificaciones para super_admin */}
        {user?.role === 'super_admin' && (
          <NotificationBell count={pendingCount} />
        )}

        {/* Información del usuario */}
        {user && (
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-300">{user.email}</div>
            </div>
          </div>
        )}

        {/* Botón de logout */}
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavbarDashboard;
