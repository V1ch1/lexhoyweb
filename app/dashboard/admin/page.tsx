"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { StatCard, QuickActionCard } from "@/components/dashboard/shared";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Interfaces
interface SystemStats {
  totalUsers: number;
  supabaseDespachos: number;
  newDespachos: number;
  totalLeads: number;
  usersByRole: {
    super_admin: number;
    despacho_admin: number;
    usuario: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Cargar estadísticas del sistema
  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const stats = await response.json();
          setSystemStats(stats);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [user?.id, user?.role]);

  // Cargar solicitudes pendientes
  useEffect(() => {
    if (user?.role !== "super_admin") return;

    fetch("/api/solicitudes-despacho-pendientes")
      .then((res) => res.json())
      .then((response) => {
        const pendientes =
          response.solicitudes?.filter(
            (s: { estado: string }) => s.estado === "pendiente"
          ).length || 0;
        setSolicitudesPendientes(pendientes);
      })
      .catch((err) => {
        console.error("Error cargando solicitudes:", err);
      });
  }, [user?.role]);



  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no es super admin
  if (user.role !== "super_admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Panel de Administración 🛡️
        </h1>
        <p className="text-lg text-gray-600">
          Gestión completa del sistema LexHoy
        </p>
      </div>

      {/* Alerta de solicitudes pendientes */}
      {!statsLoading && solicitudesPendientes > 0 && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">
                  {solicitudesPendientes}{" "}
                  {solicitudesPendientes === 1
                    ? "solicitud pendiente"
                    : "solicitudes pendientes"}
                </h3>
                <p className="text-sm text-yellow-800">
                  Hay solicitudes de despacho esperando tu revisión
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard/admin/users/solicitudes")}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Revisar ahora
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            </div>
          ))}
        </div>
      )}

      {!statsLoading && systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Usuarios"
            value={systemStats.totalUsers}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Despachos en Supabase"
            value={systemStats.supabaseDespachos}
            icon={BuildingOfficeIcon}
            color="green"
          />
          <StatCard
            title="Leads Totales"
            value={systemStats.totalLeads}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatCard
            title="Admins Despacho"
            value={systemStats.usersByRole.despacho_admin}
            icon={UserGroupIcon}
            color="orange"
          />
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Gestión de Leads"
            description="Administra leads, precios, campos y configuración"
            icon={ClipboardDocumentListIcon}
            onClick={() => router.push("/dashboard/admin/leads-list")}
            color="blue"
          />
          <QuickActionCard
            title="Gestión de Usuarios"
            description="Administra usuarios, roles y permisos"
            icon={UserGroupIcon}
            onClick={() => router.push("/dashboard/admin/users")}
            color="purple"
          />
          <QuickActionCard
            title="Ver Solicitudes"
            description="Revisa solicitudes de despachos pendientes"
            icon={DocumentTextIcon}
            onClick={() => router.push("/dashboard/admin/users/solicitudes")}
            color="yellow"
            badge={solicitudesPendientes}
          />
          <QuickActionCard
            title="Gestionar Despachos"
            description="Administra todos los despachos del sistema"
            icon={BuildingOfficeIcon}
            onClick={() => router.push("/dashboard/despachos")}
            color="green"
          />
          <QuickActionCard
            title="Gestión de Marketing"
            description="Administra campañas y contenido de marketing"
            icon={ChartBarIcon}
            onClick={() => router.push("/dashboard/admin/marketing")}
            color="orange"
          />
          <QuickActionCard
            title="Configuración"
            description="Ajusta tu perfil y preferencias"
            icon={CogIcon}
            onClick={() => router.push("/dashboard/settings")}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
