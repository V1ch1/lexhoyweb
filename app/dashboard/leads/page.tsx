"use client";

import { useEffect, useState } from "react";
import { LeadCard } from "@/components/leads/LeadCard";
import { FunnelIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { capitalize } from "@/lib/utils";

interface Lead {
  id: string;
  especialidad: string;
  provincia: string;
  ciudad?: string;
  urgencia: string;
  resumen_ia: string;
  precio_base: number;
  precio_actual?: number;
  puntuacion_calidad: number;
  estado: string;
  fecha_fin_subasta?: string;
  created_at: string;
}

type TabType = "disponibles" | "mis-compras";

export default function LeadsMarketplacePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("disponibles");
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState({
    especialidad: "",
    provincia: "",
    urgencia: "",
    precioMax: "",
    calidadMin: "",
  });
  
  const [sortBy, setSortBy] = useState<string>("reciente");

  useEffect(() => {
    fetchLeads();
  }, [activeTab]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === "disponibles" 
        ? "/api/leads" 
        : "/api/leads/purchased";
      
      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success) {
        setLeads(data.data);
      } else {
        setError(data.error || "Error cargando leads");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar leads
  let filteredLeads = leads.filter((lead) => {
    if (filters.especialidad && lead.especialidad !== filters.especialidad)
      return false;
    if (filters.provincia && lead.provincia !== filters.provincia)
      return false;
    if (filters.urgencia && lead.urgencia !== filters.urgencia)
      return false;
    if (filters.precioMax && lead.precio_base > parseFloat(filters.precioMax))
      return false;
    if (filters.calidadMin && lead.puntuacion_calidad < parseFloat(filters.calidadMin))
      return false;
    return true;
  });

  // Ordenar leads
  filteredLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case "reciente":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "precio-asc":
        return a.precio_base - b.precio_base;
      case "precio-desc":
        return b.precio_base - a.precio_base;
      case "calidad":
        return b.puntuacion_calidad - a.puntuacion_calidad;
      default:
        return 0;
    }
  });

  // Obtener listas únicas para filtros
  const especialidades = Array.from(
    new Set(leads.map((l) => l.especialidad).filter(Boolean))
  );
  const provincias = Array.from(
    new Set(leads.map((l) => l.provincia).filter(Boolean))
  );

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-playfair">
          Marketplace de Leads
        </h1>
        <p className="text-gray-500 mt-1">
          Encuentra y compra leads cualificados para tu despacho
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("disponibles")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "disponibles"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Leads Disponibles
          </button>
          <button
            onClick={() => setActiveTab("mis-compras")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "mis-compras"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Mis Compras
          </button>
        </nav>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={() => setFilters({
                especialidad: "",
                provincia: "",
                urgencia: "",
                precioMax: "",
                calidadMin: "",
              })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-600" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            <option value="reciente">Más recientes</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="calidad">Mejor calidad</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <select
                value={filters.especialidad}
                onChange={(e) =>
                  setFilters({ ...filters, especialidad: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="">Todas</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                value={filters.provincia}
                onChange={(e) =>
                  setFilters({ ...filters, provincia: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="">Todas</option>
                {provincias.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgencia
              </label>
              <select
                value={filters.urgencia}
                onChange={(e) =>
                  setFilters({ ...filters, urgencia: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="">Todas</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo (€)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Ej: 100"
                value={filters.precioMax}
                onChange={(e) =>
                  setFilters({ ...filters, precioMax: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad mínima
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={filters.calidadMin}
                onChange={(e) =>
                  setFilters({ ...filters, calidadMin: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"} {activeTab === "disponibles" ? "disponibles" : "comprados"}
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-xl">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchLeads}
            className="mt-4 text-primary hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">
            {activeTab === "disponibles"
              ? "No hay leads disponibles con estos filtros."
              : "Aún no has comprado ningún lead."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
