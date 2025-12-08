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

interface LeadsAnalytics {
  byEspecialidad: Array<{
    name: string;
    total: number;
    vendidos: number;
    ingresos: number;
    conversionRate: number;
  }>;
  byUrgencia: Array<{ name: string; value: number }>;
  byEstado: Array<{ name: string; value: number }>;
}

interface DespachosAnalytics {
  topDespachos: Array<{
    nombre: string;
    ciudad: string;
    provincia: string;
    compras: number;
    gastado: number;
  }>;
  byProvincia: Array<{ name: string; value: number }>;
}

type TabType = "general" | "tendencias" | "leads" | "despachos";

export default function EstadisticasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [leadsAnalytics, setLeadsAnalytics] = useState<LeadsAnalytics | null>(null);
  const [despachosAnalytics, setDespachosAnalytics] = useState<DespachosAnalytics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Cargar estadísticas
  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const [overviewRes, chartsRes, leadsRes, despachosRes] = await Promise.all([
          fetch("/api/admin/analytics/overview"),
          fetch(`/api/admin/analytics/charts?days=${selectedPeriod}`),
          fetch("/api/admin/analytics/leads"),
          fetch("/api/admin/analytics/despachos"),
        ]);

        if (overviewRes.ok) setOverviewStats(await overviewRes.json());
        if (chartsRes.ok) setChartData(await chartsRes.json());
        if (leadsRes.ok) setLeadsAnalytics(await leadsRes.json());
        if (despachosRes.ok) setDespachosAnalytics(await despachosRes.json());
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

  const tabs = [
    { id: "general" as TabType, name: "📊 General", icon: ChartBarIcon },
    { id: "tendencias" as TabType, name: "📈 Tendencias", icon: ChartBarIcon },
    { id: "leads" as TabType, name: "📋 Leads", icon: ClipboardDocumentListIcon },
    { id: "despachos" as TabType, name: "🏢 Despachos", icon: BuildingOfficeIcon },
  ];

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📊 Estadísticas Completas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Análisis detallado del rendimiento del sistema
            </p>
          </div>

          {/* Selector de período */}
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  selectedPeriod === days
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto" style={{ height: "calc(100vh - 180px)" }}>
        {/* Tab: General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* KPIs */}
            {!statsLoading && overviewStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

            {/* Resumen rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {!statsLoading && chartData && (
                <>
                  <LineChartCard
                    title="Nuevos Usuarios (Últimos 30 días)"
                    data={chartData.dailyUsers}
                    dataKey="count"
                    color="#3b82f6"
                  />
                  <LineChartCard
                    title="Leads Creados (Últimos 30 días)"
                    data={chartData.dailyLeads}
                    dataKey="count"
                    color="#8b5cf6"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: Tendencias */}
        {activeTab === "tendencias" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Evolución Temporal
            </h2>
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
        )}

        {/* Tab: Leads */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Análisis Detallado de Leads
            </h2>
            {!statsLoading && leadsAnalytics && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <BarChartCard
                      title="Leads por Especialidad (Top 10)"
                      data={leadsAnalytics.byEspecialidad.map((e) => ({
                        name: e.name,
                        value: e.total,
                      }))}
                      color="#8b5cf6"
                    />
                  </div>
                  <BarChartCard
                    title="Leads por Urgencia"
                    data={leadsAnalytics.byUrgencia}
                    color="#f59e0b"
                  />
                </div>

                {/* Tabla de especialidades con detalles */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Detalle por Especialidad
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Especialidad
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Vendidos
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Conversión
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Ingresos
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leadsAnalytics.byEspecialidad.map((esp, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {esp.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {esp.total}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {esp.vendidos}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {esp.conversionRate}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                              {esp.ingresos}€
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Despachos */}
        {activeTab === "despachos" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Análisis de Despachos
            </h2>
            {!statsLoading && despachosAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Despachos */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🏆 Top 10 Despachos Compradores
                  </h3>
                  <div className="space-y-3">
                    {despachosAnalytics.topDespachos.map((despacho, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{despacho.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {despacho.ciudad}, {despacho.provincia}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{despacho.compras} leads</p>
                          <p className="text-sm font-semibold text-green-600">{despacho.gastado}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribución Geográfica */}
                <BarChartCard
                  title="Despachos por Provincia (Top 10)"
                  data={despachosAnalytics.byProvincia}
                  color="#10b981"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
