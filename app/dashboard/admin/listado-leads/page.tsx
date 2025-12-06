"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  EyeIcon,
  CheckCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import LeadStatsCards from "@/components/admin/LeadStatsCards";
import LeadFilters, { FilterValues } from "@/components/admin/LeadFilters";
import { Lead } from "@/lib/services/leadService";

export default function AdminLeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 20;

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const response = await fetch("/api/admin/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
        setFilteredLeads(data);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterValues) => {
    let filtered = [...leads];

    // Filtro por estado
    if (filters.estado) {
      filtered = filtered.filter((lead) => lead.estado === filters.estado);
    }

    // Filtro por especialidad
    if (filters.especialidad) {
      filtered = filtered.filter(
        (lead) => lead.especialidad === filters.especialidad
      );
    }

    // Filtro por provincia
    if (filters.provincia) {
      filtered = filtered.filter((lead) =>
        lead.provincia?.toLowerCase().includes(filters.provincia!.toLowerCase())
      );
    }

    // Filtro por urgencia
    if (filters.urgencia) {
      filtered = filtered.filter((lead) => lead.urgencia === filters.urgencia);
    }

    // Filtro por búsqueda
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.resumen_ia?.toLowerCase().includes(searchTerm) ||
          lead.cuerpo_mensaje?.toLowerCase().includes(searchTerm) ||
          lead.id.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por calidad mínima
    if (filters.calidadMin) {
      filtered = filtered.filter(
        (lead) => (lead.puntuacion_calidad || 0) >= filters.calidadMin!
      );
    }

    // Filtro por precio máximo
    if (filters.precioMax) {
      filtered = filtered.filter(
        (lead) => (lead.precio_base || 0) <= filters.precioMax!
      );
    }

    setFilteredLeads(filtered);
    setCurrentPage(1); // Reset a la primera página
  };

  // Paginación
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-playfair">
            Gestión de Leads
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra todos los leads del sistema
          </p>
        </div>
        <Link
          href="/dashboard/admin/crear-lead"
          className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Crear Lead Manual
        </Link>
      </div>

      {/* Estadísticas */}
      <LeadStatsCards />

      {/* Filtros */}
      <LeadFilters onFilterChange={handleFilterChange} />

      {/* Tabla de Leads */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resumen / Especialidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calidad
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    {filteredLeads.length === 0 && leads.length > 0
                      ? "No se encontraron leads con los filtros aplicados."
                      : "No hay leads registrados."}
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.id.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString("es-ES")}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {lead.resumen_ia ||
                          lead.cuerpo_mensaje.substring(0, 80) + "..."}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {lead.especialidad || "Sin especialidad"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.provincia || "-"}
                      </div>
                      {lead.ciudad && (
                        <div className="text-xs text-gray-500">
                        : lead.precio_estimado
                        ? `~${formatCurrency(lead.precio_estimado)}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lead.puntuacion_calidad ? (
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-16 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                lead.puntuacion_calidad >= 70
                                  ? "bg-green-500"
                                  : lead.puntuacion_calidad >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${lead.puntuacion_calidad}%`,
                              }}
                            ></div>
                          </div>
                          <span
                            className={`font-medium ${
                              lead.puntuacion_calidad >= 70
                                ? "text-green-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {lead.puntuacion_calidad}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {(lead.estado === "pendiente" ||
                          (lead.estado === "procesado" &&
                            !lead.aprobado_por)) && (
                          <Link
                            href={`/dashboard/admin/aprobar-lead/${lead.id}`}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Aprobar precio"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/admin/leads/${lead.id}`}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">{indexOfFirstLead + 1}</span> a{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastLead, filteredLeads.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">{filteredLeads.length}</span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-primary border-primary text-white"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
