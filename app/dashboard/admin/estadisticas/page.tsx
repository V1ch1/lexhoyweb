"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import KPICard from "@/components/admin/analytics/KPICard";
import LineChartCard from "@/components/admin/analytics/LineChartCard";
import BarChartCard from "@/components/admin/analytics/BarChartCard";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

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

export default function EstadisticasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Cargar estadísticas
  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        // Cargar overview
        const overviewRes = await fetch("/api/admin/analytics/overview");
        if (overviewRes.ok) {
          const overview = await overviewRes.json();
          setOverviewStats(overview);
        }

        // Cargar charts
        const chartsRes = await fetch(`/api/admin/analytics/charts?days=${selectedPeriod}`);
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
  }, [user?.id, user?.role, selectedPeriod]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "super_admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📊 Estadísticas Completas
            </h1>
            <p className="text-lg text-gray-600">
              Análisis detallado del rendimiento del sistema
            </p>
          </div>

          {/* Selector de período */}
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === days
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      {statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      )}

      {!statsLoading && overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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
            title="Tasa de Conversión"
            value={overviewStats.conversionRate}
            icon={ChartBarIcon}
            color="pink"
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
          Tendencias Temporales
        </h2>

        {statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {!statsLoading && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <LineChartCard
              title="Ventas de Leads por Día"
              data={chartData.dailySales}
              dataKey="count"
              color="#10b981"
            />
            <LineChartCard
              title="Ingresos Diarios"
              data={chartData.dailyRevenue}
              dataKey="amount"
              color="#f59e0b"
              format="currency"
            />
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          💡 Próximas Mejoras
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Análisis detallado por especialidad de leads</li>
          <li>• Ranking de despachos más activos</li>
          <li>• Distribución geográfica de usuarios</li>
          <li>• Análisis de notificaciones y engagement</li>
          <li>• Proyecciones de ingresos basadas en tendencias</li>
        </ul>
      </div>
    </div>
  );
}
