"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import { User, SolicitudRegistro } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  ArrowRightIcon,
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

  // Componente de tarjeta de acción rápida
  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    color = "blue",
    badge,
    count
  }: { 
    title: string; 
    description: string; 
    icon: React.ComponentType<{ className?: string }>; 
    onClick: () => void; 
    color?: string;
    badge?: number;
    count?: number;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
      green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
      purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
      orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
    };

    return (
      <button
        onClick={onClick}
        className={`${colorClasses[color as keyof typeof colorClasses]} relative w-full p-8 rounded-xl transition-all duration-200 hover:shadow-lg text-left group border-2`}
      >
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-6 right-6 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {badge}
          </span>
        )}
        <Icon className="h-12 w-12 mb-4" />
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-base opacity-80 mb-4">{description}</p>
        {count !== undefined && (
          <p className="text-3xl font-bold mb-3">{count}</p>
        )}
        <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Ir a {title.toLowerCase()}</span>
          <ArrowRightIcon className="h-5 w-5 ml-2" />
        </div>
      </button>
    );
  };

  const solicitudesPendientes = solicitudes.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="w-full">
      {/* Header moderno */}
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
          onClick={() => router.push("/admin/users/list")}
          color="blue"
          count={users.length}
        />
        
        <QuickActionCard
          title="Solicitudes"
          description="Revisar solicitudes de despachos pendientes"
          icon={ClipboardDocumentListIcon}
          onClick={() => router.push("/admin/users/solicitudes")}
          color="purple"
          badge={solicitudesPendientes}
          count={solicitudesPendientes}
        />
        
        <QuickActionCard
          title="Crear Usuario"
          description="Añadir un nuevo usuario al sistema"
          icon={UserPlusIcon}
          onClick={() => router.push("/admin/users/create")}
          color="green"
        />
      </div>
    </div>
  );
}
