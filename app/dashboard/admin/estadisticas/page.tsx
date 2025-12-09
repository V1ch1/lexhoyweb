"use client";

import { useEffect, useState, useRef } from "react";
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

interface MarketingAnalytics {
  visitors: { today: number; week: number; month: number };
  sessions: { today: number; week: number; month: number };
  pageviews: { today: number; week: number; month: number };
  bounceRate: number;
  avgSessionDuration: number;
  trafficSources: Array<{ source: string; sessions: number; percentage: number }>;
  popularPages: Array<{ path: string; title: string; pageviews: number; avgTime: number }>;
}

type TabType = "general" | "tendencias" | "leads" | "despachos" | "marketing";

export default function EstadisticasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [leadsAnalytics, setLeadsAnalytics] = useState<LeadsAnalytics | null>(null);
  const [despachosAnalytics, setDespachosAnalytics] = useState<DespachosAnalytics | null>(null);
  const [marketingAnalytics, setMarketingAnalytics] = useState<MarketingAnalytics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [customDateRange, setCustomDateRange] = useState<{start: string; end: string} | null>(null);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Cargar estadísticas
  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        // Calcular días según el rango personalizado o el período seleccionado
        let days = selectedPeriod;
        if (customDateRange) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        const [overviewRes, chartsRes, leadsRes, despachosRes] = await Promise.all([
          fetch("/api/admin/analytics/overview"),
          fetch(`/api/admin/analytics/charts?days=${days}`),
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
  }, [user?.id, user?.role, selectedPeriod, customDateRange]);

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

  // Cargar estadísticas de marketing cuando se selecciona el tab o cambian los filtros
  useEffect(() => {
    if (activeTab === "marketing") {
      loadMarketingStats();
    }
  }, [activeTab, selectedPeriod, customDateRange]);

  const loadMarketingStats = async () => {
    setMarketingLoading(true);
    try {
      // Calcular días según el rango personalizado o el período seleccionado
      let days = selectedPeriod;
      if (customDateRange) {
        const start = new Date(customDateRange.start);
        const end = new Date(customDateRange.end);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      const [overviewRes, contentRes] = await Promise.all([
        fetch(`/api/marketing/analytics/overview?days=${days}`),
        fetch(`/api/marketing/analytics/content?days=${days}`),
      ]);

      if (overviewRes.ok && contentRes.ok) {
        const overview = await overviewRes.json();
        const content = await contentRes.json();
        
        setMarketingAnalytics({
          ...overview,
          ...content,
        });
      }
    } catch (error) {
      console.error("Error loading marketing stats:", error);
    } finally {
      setMarketingLoading(false);
    }
  };

  const tabs = [
    { id: "general" as TabType, name: "📊 General", icon: ChartBarIcon },
    { id: "tendencias" as TabType, name: "📈 Tendencias", icon: ChartBarIcon },
    { id: "leads" as TabType, name: "📋 Leads", icon: ClipboardDocumentListIcon },
    { id: "despachos" as TabType, name: "🏢 Despachos", icon: BuildingOfficeIcon },
    { id: "marketing" as TabType, name: "🌐 LexHoy.com", icon: ChartBarIcon },
  ];

  const periodOptions = [
    { value: 7, label: "7 días" },
    { value: 30, label: "30 días" },
    { value: 90, label: "90 días" },
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
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <div className="flex gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedPeriod(option.value);
                    setCustomDateRange(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === option.value && !customDateRange
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => {
                    setTempStartDate(e.target.value);
                    // Auto-open end date picker after start date is selected
                    if (e.target.value) {
                      setTimeout(() => {
                        endDateInputRef.current?.focus();
                        endDateInputRef.current?.showPicker?.();
                      }, 100);
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 text-xs">→</span>
                <input
                  ref={endDateInputRef}
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (tempStartDate && tempEndDate) {
                      setCustomDateRange({
                        start: tempStartDate,
                        end: tempEndDate
                      });
                    }
                  }}
                  disabled={!tempStartDate || !tempEndDate}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
                {customDateRange && (
                  <button
                    onClick={() => {
                      setCustomDateRange(null);
                      setTempStartDate('');
                      setTempEndDate('');
                    }}
                    className="px-2 py-1.5 text-gray-600 hover:text-red-600 transition-colors"
                    title="Limpiar fechas"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
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
            {statsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 mt-2"></div>
                  </div>
                ))}
              </div>
            )}
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
            {statsLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            )}
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
            {statsLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
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
            {statsLoading && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-80 bg-gray-100 rounded"></div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-80 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                        <div className="flex gap-4">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
            {statsLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Despachos Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Chart Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-96 bg-gray-100 rounded"></div>
                </div>
              </div>
            )}
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

        {/* Tab: Marketing (LexHoy.com) */}
        {activeTab === "marketing" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Estadísticas de LexHoy.com
            </h2>
            
            {marketingLoading && (
              <div className="space-y-6">
                {/* KPIs Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                  ))}
                </div>

                {/* Metrics Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="flex justify-between items-center">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Traffic and Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Traffic Sources Skeleton */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Pages Skeleton */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="ml-4">
                            <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-10"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!marketingLoading && marketingAnalytics && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Visitantes (Mes)"
                    value={marketingAnalytics.visitors.month}
                    icon={UserGroupIcon}
                    color="blue"
                  />
                  <KPICard
                    title="Sesiones (Mes)"
                    value={marketingAnalytics.sessions.month}
                    icon={ChartBarIcon}
                    color="green"
                  />
                  <KPICard
                    title="Páginas Vistas"
                    value={marketingAnalytics.pageviews.month}
                    icon={ClipboardDocumentListIcon}
                    color="purple"
                  />
                  <KPICard
                    title="Duración Promedio"
                    value={(() => {
                      const seconds = Math.round(marketingAnalytics.avgSessionDuration);
                      const minutes = Math.floor(seconds / 60);
                      const remainingSeconds = seconds % 60;
                      return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
                    })()}
                    icon={UserIcon}
                    color="orange"
                  />
                </div>

                {/* Métricas por período */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Visitantes
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hoy</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {marketingAnalytics.visitors.today.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Última semana</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {marketingAnalytics.visitors.week.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Último mes</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {marketingAnalytics.visitors.month.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Sesiones
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hoy</span>
                        <span className="text-2xl font-bold text-green-600">
                          {marketingAnalytics.sessions.today.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Última semana</span>
                        <span className="text-2xl font-bold text-green-600">
                          {marketingAnalytics.sessions.week.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Último mes</span>
                        <span className="text-2xl font-bold text-green-600">
                          {marketingAnalytics.sessions.month.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Páginas Vistas
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hoy</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {marketingAnalytics.pageviews.today.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Última semana</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {marketingAnalytics.pageviews.week.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Último mes</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {marketingAnalytics.pageviews.month.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tráfico y Contenido */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fuentes de Tráfico */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🌐 Fuentes de Tráfico (Top 10)
                    </h3>
                    <div className="space-y-3">
                      {marketingAnalytics.trafficSources.map((source, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {source.source}
                              </span>
                              <span className="text-sm text-gray-600">
                                {source.sessions.toLocaleString()} ({source.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${source.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Páginas Populares */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📄 Páginas Más Visitadas (Top 10)
                    </h3>
                    <div className="space-y-3">
                      {marketingAnalytics.popularPages.map((page, index) => (
                        <a
                          key={index}
                          href={`https://lexhoy.com${page.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{page.path}</p>
                          </div>
                          <div className="text-right ml-4 flex items-center gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {page.pageviews.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">vistas</p>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {!marketingLoading && !marketingAnalytics && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  ⚠️ Configuración Pendiente
                </h3>
                <p className="text-yellow-800 mb-4">
                  Para ver las estadísticas de LexHoy.com, necesitas habilitar la Google Analytics Data API.
                </p>
                <a
                  href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=897658015460"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Habilitar API →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
