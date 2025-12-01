"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import { toast } from "sonner";
import { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import {
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const userService = new UserService();

export default function CreateUserPage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const [newUser, setNewUser] = useState({
    email: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    rol: "usuario" as UserRole,
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await userService.createUserWithAuth(newUser);

      toast.success(
        `Usuario creado exitosamente. Contraseña temporal: ${result.temporaryPassword}`
      );

      setNewUser({
        email: "",
        nombre: "",
        apellidos: "",
        telefono: "",
        rol: "usuario",
      });

      router.push("/dashboard/admin/users/list");
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al crear usuario: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/admin/users")}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Gestión de Usuarios
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Crear Nuevo Usuario
        </h1>
        <p className="text-lg text-gray-600">
          Añade un nuevo usuario al sistema con credenciales de acceso
        </p>
      </div>

      <div className="space-y-6">
        {/* Información importante */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm max-w-4xl">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Información importante
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Se creará automáticamente la cuenta de autenticación</li>
                <li>• Se generará una contraseña temporal para compartir</li>
                <li>
                  • El usuario debe cambiarla en su primer inicio de sesión
                </li>
                <li>
                  • Los usuarios normales requieren asignación a un despacho
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleCreateUser}
          className="bg-white border border-gray-100 rounded-xl p-8 space-y-6 shadow-sm"
        >
          <h3 className="text-2xl font-bold text-gray-900 pb-4 border-b border-gray-200">
            Datos del Nuevo Usuario
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newUser.nombre}
                onChange={(e) =>
                  setNewUser({ ...newUser, nombre: e.target.value })
                }
                placeholder="Juan"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newUser.apellidos}
                onChange={(e) =>
                  setNewUser({ ...newUser, apellidos: e.target.value })
                }
                placeholder="Pérez García"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={newUser.telefono}
                  onChange={(e) =>
                    setNewUser({ ...newUser, telefono: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={newUser.rol}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    rol: e.target.value as UserRole,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="usuario">Usuario</option>
                <option value="despacho_admin">Admin Despacho</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() =>
                setNewUser({
                  email: "",
                  nombre: "",
                  apellidos: "",
                  telefono: "",
                  rol: "usuario",
                })
              }
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar formulario
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
