"use client";

import { useState } from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface LeadFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  estado?: string;
  especialidad?: string;
  provincia?: string;
  urgencia?: string;
  busqueda?: string;
  calidadMin?: number;
  precioMax?: number;
}

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "procesado", label: "Procesado" },
  { value: "en_subasta", label: "En Subasta" },
  { value: "vendido", label: "Vendido" },
  { value: "descartado", label: "Descartado" },
];

const ESPECIALIDADES = [
  { value: "", label: "Todas" },
  { value: "Civil", label: "Civil" },
  { value: "Penal", label: "Penal" },
  { value: "Laboral", label: "Laboral" },
  { value: "Mercantil", label: "Mercantil" },
  { value: "Familia", label: "Familia" },
  { value: "Administrativo", label: "Administrativo" },
  { value: "Fiscal", label: "Fiscal" },
  { value: "Inmobiliario", label: "Inmobiliario" },
];

const URGENCIAS = [
  { value: "", label: "Todas" },
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export default function LeadFilters({ onFilterChange }: LeadFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
          <span className="font-medium text-gray-700">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Limpiar filtros
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por texto */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar en resumen IA..."
                value={filters.busqueda || ""}
                onChange={(e) => handleFilterChange("busqueda", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.estado || ""}
                onChange={(e) => handleFilterChange("estado", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgencia
              </label>
              <select
                value={filters.urgencia || ""}
                onChange={(e) => handleFilterChange("urgencia", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {URGENCIAS.map((urgencia) => (
                  <option key={urgencia.value} value={urgencia.value}>
                    {urgencia.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Especialidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <select
                value={filters.especialidad || ""}
                onChange={(e) =>
                  handleFilterChange("especialidad", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ESPECIALIDADES.map((esp) => (
                  <option key={esp.value} value={esp.value}>
                    {esp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <input
                type="text"
                placeholder="Ej: Madrid"
                value={filters.provincia || ""}
                onChange={(e) => handleFilterChange("provincia", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Calidad mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad Mínima
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={filters.calidadMin || ""}
                onChange={(e) =>
                  handleFilterChange("calidadMin", parseInt(e.target.value) || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Precio máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Máximo (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 100"
                value={filters.precioMax || ""}
                onChange={(e) =>
                  handleFilterChange("precioMax", parseFloat(e.target.value) || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
