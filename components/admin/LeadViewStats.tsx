"use client";

import { useEffect, useState } from "react";
import {
  EyeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DespachoViewStats {
  despacho_id: string | null;
  despacho_nombre: string;
  count: number;
  last_viewed: string;
  first_viewed: string;
}

interface ViewStats {
  total_views: number;
  unique_despachos: number;
  by_despacho: DespachoViewStats[];
  recent_views: any[];
}

interface LeadViewStatsProps {
  leadId: string;
}

export default function LeadViewStats({ leadId }: LeadViewStatsProps) {
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [leadId]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/view-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading view stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Estadísticas de Visualización
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_views === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Estadísticas de Visualización
        </h2>
        <div className="text-center py-8">
          <EyeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Este lead aún no ha sido visualizado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Estadísticas de Visualización
      </h2>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <EyeIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Total Vistas
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.total_views}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Despachos
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.unique_despachos}
          </p>
        </div>
      </div>

      {/* Popularidad */}
      {stats.total_views > 10 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">
              🔥 Lead Popular
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Este lead ha generado mucho interés
          </p>
        </div>
      )}

      {/* Lista de despachos */}
      {stats.by_despacho.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Visualizaciones por Despacho
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.by_despacho.map((despacho, index) => (
              <div
                key={despacho.despacho_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {despacho.despacho_nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    Última vista:{" "}
                    {new Date(despacho.last_viewed).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-1">
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-bold text-gray-900">
                    {despacho.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
