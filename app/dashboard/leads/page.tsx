"use client";

import { useEffect, useState } from "react";
import { LeadCard } from "@/components/leads/LeadCard";

interface Lead {
  id: string;
  especialidad: string;
  provincia: string;
  urgencia: string;
  resumen_ia: string;
  precio_base: number;
  puntuacion_calidad: number;
  created_at: string;
}

export default function LeadsMarketplacePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    especialidad: "",
    provincia: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leads");
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

  const filteredLeads = leads.filter((lead) => {
    if (
      filters.especialidad &&
      lead.especialidad !== filters.especialidad
    )
      return false;
    if (
      filters.provincia &&
      lead.provincia !== filters.provincia
    )
      return false;
    return true;
  });

  // Obtener listas únicas para filtros
  const especialidades = Array.from(
    new Set(leads.map((l) => l.especialidad).filter(Boolean))
  );
  const provincias = Array.from(
    new Set(leads.map((l) => l.provincia).filter(Boolean))
  );

  return (
    <div className="p-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Marketplace de Leads
          </h1>
          <p className="text-gray-500 mt-1">
            Encuentra y compra leads cualificados para tu despacho
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#E04040] focus:border-[#E04040]"
            value={filters.especialidad}
            onChange={(e) =>
              setFilters({ ...filters, especialidad: e.target.value })
            }
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#E04040] focus:border-[#E04040]"
            value={filters.provincia}
            onChange={(e) =>
              setFilters({ ...filters, provincia: e.target.value })
            }
          >
            <option value="">Todas las provincias</option>
            {provincias.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            className="mt-4 text-[#E04040] hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">
            No hay leads disponibles con estos filtros.
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
