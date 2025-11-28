"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import { User, SolicitudRegistro } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { QuickActionCard } from "@/components/dashboard/shared";
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const userService = new UserService();

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);

  const checkPermissionsAndLoadData = useCallback(async () => {
    try {
      if (!user) return;

      const isSuperAdmin = user.role === "super_admin";

      if (isSuperAdmin) {
        await loadUsers();
        await loadSolicitudes();
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  }, [user]);

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, [checkPermissionsAndLoadData]);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSolicitudes = async () => {
    try {
      const allSolicitudes = await userService.getAllSolicitudes();
      setSolicitudes(
        allSolicitudes.map((s) => ({
          id: s.id as string,
          user_id: s.user_id as string | undefined,
          user_email: s.user_email as string | undefined,
          user_name: s.user_name as string | undefined,
          despacho_id: s.despacho_id as string | undefined,
          despacho_nombre: s.despacho_nombre as string | undefined,
          despacho_localidad: s.despacho_localidad as string | undefined,
          despacho_provincia: s.despacho_provincia as string | undefined,
          estado: s.estado as "pendiente" | "aprobado" | "rechazado",
          fechaSolicitud: s.fecha_solicitud
            ? new Date(s.fecha_solicitud as string)
            : new Date(0),
          fechaRespuesta: s.fecha_respuesta
            ? new Date(s.fecha_respuesta as string)
            : undefined,
          respondidoPor: s.respondidoPor as string | undefined,
          notasRespuesta: s.notasRespuesta as string | undefined,
          userCreadoId: s.userCreadoId as string | undefined,
          despachoCreadoId: s.despachoCreadoId as string | undefined,
          email: s.email as string | undefined,
          nombre: s.nombre as string | undefined,
          apellidos: s.apellidos as string | undefined,
          telefono: s.telefono as string | undefined,
          empresa: s.empresa as string | undefined,
          mensaje: s.mensaje as string | undefined,
          datosDespacho: s.datosDespacho as SolicitudRegistro["datosDespacho"],
        }))
      );
    } catch (error) {
      console.error("Error loading solicitudes:", error);
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

  const solicitudesPendientes = solicitudes.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-lg text-gray-600">
          Administra usuarios, roles y solicitudes • {users.length} usuarios totales
        </p>
      </div>

      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="Usuarios"
          description="Ver y gestionar todos los usuarios del sistema"
          icon={UserGroupIcon}
          href="/dashboard/admin/users/list"
          color="blue"
        />
        
        <QuickActionCard
          title="Solicitudes"
          description="Revisar solicitudes de despachos pendientes"
          icon={ClipboardDocumentListIcon}
          href="/dashboard/admin/users/solicitudes"
          color="purple"
          badge={solicitudesPendientes}
        />
        
        <QuickActionCard
          title="Crear Usuario"
          description="Añadir un nuevo usuario al sistema"
          icon={UserPlusIcon}
          href="/dashboard/admin/users/create"
          color="green"
        />
      </div>

      {/* Estadísticas adicionales */}
      {users.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              </div>
              <UserGroupIcon className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{solicitudesPendientes}</p>
              </div>
              <ClipboardDocumentListIcon className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins Despacho</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter(u => u.rol === "despacho_admin").length}
                </p>
              </div>
              <UserGroupIcon className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
