"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import KPICard from "@/components/admin/analytics/KPICard";
import {
  UserGroupIcon,
  GlobeAltIcon,
  EyeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface AnalyticsMetrics {
  visitors: { today: number; week: number; month: number };
  sessions: { today: number; week: number; month: number };
  pageviews: { today: number; week: number; month: number };
  bounceRate: number;
  avgSessionDuration: number;
}

interface ContentData {
  trafficSources: Array<{ source: string; sessions: number; percentage: number }>;
  popularPages: Array<{ path: string; title: string; pageviews: number; avgTime: number }>;
}

export default function MarketingEstadisticasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || user.role !== "super_admin") return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [metricsRes, contentRes] = await Promise.all([
          fetch("/api/marketing/analytics/overview"),
          fetch("/api/marketing/analytics/content"),
        ]);

        if (metricsRes.ok) {
          const data = await metricsRes.json();
          if (data.error) {
            setError(data.error);
          } else {
            setMetrics(data);
          }
        }

        if (contentRes.ok) {
          const data = await contentRes.json();
          if (!data.error) {
            setContent(data);
          }
        }
      } catch (err) {
        setError("Error al cargar estadísticas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user?.id, user?.role]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📊 Estadísticas de LexHoy.com
        </h1>
        <p className="text-lg text-gray-600">
          Métricas de tráfico y rendimiento del sitio web
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Configuración Pendiente
          </h3>
          <p className="text-yellow-800 mb-4">{error}</p>
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Para ver las estadísticas, configura:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Cuenta de servicio en Google Cloud</li>
              <li>Habilitar Google Analytics Data API</li>
              <li>Añadir variables de entorno:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>GOOGLE_ANALYTICS_PROPERTY_ID=443268831</li>
                  <li>GOOGLE_SERVICE_ACCOUNT_KEY={"{"} ... {"}"}</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {!loading && metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Visitantes (Mes)"
              value={metrics.visitors.month}
              icon={UserGroupIcon}
              color="blue"
            />
            <KPICard
              title="Sesiones (Mes)"
              value={metrics.sessions.month}
              icon={GlobeAltIcon}
              color="green"
            />
            <KPICard
              title="Páginas Vistas (Mes)"
              value={metrics.pageviews.month}
              icon={EyeIcon}
              color="purple"
            />
            <KPICard
              title="Duración Promedio"
              value={Math.round(metrics.avgSessionDuration)}
              icon={ClockIcon}
              color="orange"
              format="number"
            />
          </div>

          {/* Métricas por período */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Visitantes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hoy</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.visitors.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última semana</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.visitors.week.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Último mes</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.visitors.month.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sesiones
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hoy</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.sessions.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última semana</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.sessions.week.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Último mes</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.sessions.month.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Páginas Vistas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hoy</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {metrics.pageviews.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última semana</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {metrics.pageviews.week.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Último mes</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {metrics.pageviews.month.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tráfico y Contenido */}
      {!loading && content && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuentes de Tráfico */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🌐 Fuentes de Tráfico (Top 10)
            </h3>
            <div className="space-y-3">
              {content.trafficSources.map((source, index) => (
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📄 Páginas Más Visitadas (Top 10)
            </h3>
            <div className="space-y-3">
              {content.popularPages.map((page, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{page.path}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {page.pageviews.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">vistas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
