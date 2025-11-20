// components/NavbarDashboard.tsx
"use client";

import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";
import { NotificationBell } from "@/components/NotificationBell";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const NavbarDashboard = () => {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

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
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-playfair"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavbarDashboard;
