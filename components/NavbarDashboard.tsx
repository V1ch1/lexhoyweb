// components/NavbarDashboard.tsx
"use client";

import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const NavbarDashboard = () => {
  const router = useRouter();

  // Manejo del logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-semibold">Dashboard</div>

      <div className="flex items-center space-x-4">
        {/* Icono de usuario */}
        <UserCircleIcon className="h-8 w-8 text-gray-400 cursor-pointer" />

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavbarDashboard;
