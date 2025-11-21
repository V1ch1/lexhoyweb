"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import { User, UserDespacho, UserRole, UserStatus } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const userService = new UserService();

export default function UsersListPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userDespachos, setUserDespachos] = useState<Record<string, UserDespacho[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "all">("all");

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);

      const despachoPromises = allUsers.map(async (user) => {
        const despachos = await userService.getUserDespachos(user.id);
        return { userId: user.id, despachos };
      });

      const results = await Promise.all(despachoPromises);
      const despachoMap: Record<string, UserDespacho[]> = {};
      results.forEach(({ userId, despachos }) => {
        despachoMap[userId] = despachos;
      });
      setUserDespachos(despachoMap);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadUsers();
    }
  }, [user, loadUsers]);

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      console.error("Error changing user role:", error);
      alert("Error al cambiar el rol del usuario");
    }
  };

  const StatusBadge = ({ status }: { status: UserStatus }) => {
    const isActive = status === "activo";
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Activo" : "Inactivo"}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      despacho_admin: "bg-blue-100 text-blue-800",
      usuario: "bg-gray-100 text-gray-800",
    };

    const labels = {
      super_admin: "Super Admin",
      despacho_admin: "Admin Despacho",
      usuario: "Usuario",
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchTerm === "" ||
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.rol === filterRole;
    const matchesStatus = filterStatus === "all" || u.estado === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
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
          Lista de Usuarios
        </h1>
        <p className="text-lg text-gray-600">
          {users.length} usuarios en el sistema
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
                className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos los roles</option>
                <option value="usuario">Usuario</option>
                <option value="despacho_admin">Admin Despacho</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as UserStatus | "all")}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de tarjetas de usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">
                  {user.nombre} {user.apellidos}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.telefono && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{user.telefono}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <RoleBadge role={user.rol} />
                <StatusBadge status={user.estado} />
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>{userDespachos[user.id]?.length || 0} despachos</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {new Date(user.fechaRegistro).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <select
                value={user.rol}
                onChange={(e) => handleChangeUserRole(user.id, e.target.value as UserRole)}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="usuario">Usuario</option>
                <option value="despacho_admin">Admin Despacho</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No se encontraron usuarios</p>
          <p className="text-sm text-gray-500 mt-1">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
