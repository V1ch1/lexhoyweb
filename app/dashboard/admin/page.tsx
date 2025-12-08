"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { StatCard, QuickActionCard } from "@/components/dashboard/shared";
import KPICard from "@/components/admin/analytics/KPICard";
import LineChartCard from "@/components/admin/analytics/LineChartCard";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  UserIcon,
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

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalDespachos: number;
  totalLeads: number;
  leadsVendidos: number;
  conversionRate: number;
  totalRevenue: number;
  trends: {
    users: number;
    despachos: number;
    leads: number;
    revenue: number;
  };
}

interface ChartData {
  dailyUsers: Array<{ date: string; count: number }>;
  dailyLeads: Array<{ date: string; count: number }>;
  dailySales: Array<{ date: string; count: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Cargar estadísticas del sistema
  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        // Cargar stats básicas
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const stats = await response.json();
          setSystemStats(stats);
        }

        // Cargar overview analytics
        const overviewRes = await fetch("/api/admin/analytics/overview");
        if (overviewRes.ok) {
          const overview = await overviewRes.json();
          setOverviewStats(overview);
        }

        // Cargar charts (últimos 30 días)
        const chartsRes = await fetch("/api/admin/analytics/charts?days=30");
        if (chartsRes.ok) {
          const charts = await chartsRes.json();
          setChartData(charts);
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
              onClick={() => router.push("/dashboard/admin/solicitudes")}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Revisar ahora
            </button>
          </div>
        </div>
      )}

      {/* KPIs Principales */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 animate-pulse"
            >
              <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      )}

      {!statsLoading && overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KPICard
            title="Total Usuarios"
            value={overviewStats.totalUsers}
            icon={UserGroupIcon}
            color="blue"
            trend={overviewStats.trends.users}
          />
          <KPICard
            title="Usuarios Activos"
            value={overviewStats.activeUsers}
            icon={UserIcon}
            color="green"
          />
          <KPICard
            title="Total Despachos"
            value={overviewStats.totalDespachos}
            icon={BuildingOfficeIcon}
            color="purple"
            trend={overviewStats.trends.despachos}
          />
          <KPICard
            title="Total Leads"
            value={overviewStats.totalLeads}
            icon={ClipboardDocumentListIcon}
            color="orange"
            trend={overviewStats.trends.leads}
          />
          <KPICard
            title="Tasa Conversión"
            value={overviewStats.conversionRate}
            icon={ChartBarIcon}
            color="red"
            format="percentage"
          />
          <KPICard
            title="Ingresos Totales"
            value={overviewStats.totalRevenue}
            icon={CurrencyEuroIcon}
            color="green"
            trend={overviewStats.trends.revenue}
            format="currency"
          />
        </div>
      )}

      {/* Gráficos de Tendencias */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Tendencias (Últimos 30 días)
        </h2>

        {statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-48 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {!statsLoading && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChartCard
              title="Nuevos Usuarios por Día"
              data={chartData.dailyUsers}
              dataKey="count"
              color="#3b82f6"
            />
            <LineChartCard
              title="Leads Creados por Día"
              data={chartData.dailyLeads}
              dataKey="count"
              color="#8b5cf6"
            />
          </div>
        )}
      </div>

      {/* Accesos Rápidos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickActionCard
            title="Leads"
            description="Gestión de leads"
            icon={ClipboardDocumentListIcon}
            href="/dashboard/admin/listado-leads"
            color="purple"
          />
          <QuickActionCard
            title="Usuarios"
            description="Gestión de usuarios"
            icon={UserGroupIcon}
            href="/dashboard/admin/users"
            color="green"
          />
          <QuickActionCard
            title="Solicitudes"
            description="Revisar solicitudes"
            icon={DocumentTextIcon}
            href="/dashboard/admin/solicitudes"
            color="yellow"
            badge={solicitudesPendientes}
          />
          <QuickActionCard
            title="Despachos"
            description="Gestión de despachos"
            icon={BuildingOfficeIcon}
            href="/dashboard/despachos"
            color="orange"
          />
          <QuickActionCard
            title="Marketing"
            description="Campañas y contenido"
            icon={ChartBarIcon}
            href="/dashboard/admin/marketing"
            color="red"
          />
          <QuickActionCard
            title="Estadísticas"
            description="Ver todas"
            icon={ChartBarIcon}
            href="/dashboard/admin/estadisticas"
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
