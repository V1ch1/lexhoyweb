"use client";

import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';

// Tipos de datos
interface Ubicacion {
  localidad?: string;
  provincia?: string;
  direccion?: string;
  codigo_postal?: string;
  [key: string]: string | number | undefined; // Añadido number para permitir id
}

interface Sede extends Ubicacion {
  id?: string | number;
  nombre?: string;
  telefono?: string;
  email?: string;
}

interface MetaData {
  _despacho_sedes?: Sede[];
  telefono?: string;
  email?: string;
  localidad?: string;
  provincia?: string;
  direccion?: string;
  codigo_postal?: string;
  [key: string]: unknown;
}

interface DespachoWP {
  object_id: string;
  id?: string | number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: MetaData;
  localidad?: string;
  provincia?: string;
  nombre: string;
  email_contacto?: string;
  telefono?: string;
  ubicacion?: Ubicacion;
}

interface Props {
  onImport?: (objectId: string) => Promise<{success: boolean, error?: string}>;
  onClose?: () => void;
}

export default function BuscadorDespachosWordpress({ onImport, onClose }: Props) {
  const [query, setQuery] = useState("");
  // Estado para la paginación
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  });

  // Estados para los filtros
  const [filtros, setFiltros] = useState({
    localidad: "",
    provincia: "",
  });

  const [resultados, setResultados] = useState<DespachoWP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState<string | null>(null);
  // Eliminado: ya no usamos importResult ya que usamos toast
  const [, setImportSummary] = useState<{success: boolean; error?: string} | null>(null);

  // Buscar despachos en WordPress usando la API real
  const buscarDespachos = useCallback(async (
    e?: React.FormEvent,
    page = 1
  ) => {
    e?.preventDefault?.();
    setLoading(true);
    setError(null);
    setImportSummary(null);

    try {
      console.log("🔍 Buscando despacho:", { query, page, filtros });

      // Construir los parámetros de búsqueda
      const params = new URLSearchParams({
        query: query || "",
        page: page.toString(),
        perPage: pagination.perPage.toString(),
        ...(filtros.localidad && { localidad: filtros.localidad }),
        ...(filtros.provincia && { provincia: filtros.provincia }),
      });

      const res = await fetch(`/api/despachos/wordpress/buscar?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          typeof errorData?.message === 'string' ? errorData.message : "Error al buscar despachos en WordPress"
        );
      }

      const response = await res.json();
      console.log("📊 Resultados:", response);

      // Actualizar la paginación con la respuesta del servidor
      const paginationData = response.pagination || {
        page,
        total: response.data?.length || response.length || 0,
        totalPages: 1,
        perPage: pagination.perPage
      };

      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));

      // Usar data si está presente, de lo contrario usar la respuesta completa
      let data = response.data || response;

      if (!data || data.length === 0) {
        setError("No se encontraron despachos con los filtros actuales");
        setResultados([]);
        return;
      }

      // Asegurarse de que cada despacho tenga un object_id
      data = data.map((item: DespachoWP) => ({
        ...item,
        object_id: item.object_id || item.id || String(Math.random())
      }));

      // Aplicar filtros si existen
      if (filtros.provincia) {
        data = data.filter((d: DespachoWP) => 
          d.meta?._despacho_sedes?.[0]?.provincia === filtros.provincia
        );
      }

      if (filtros.localidad) {
        data = data.filter((d: DespachoWP) => 
          d.meta?._despacho_sedes?.[0]?.localidad === filtros.localidad
        );
      }

      setResultados(data);
    } catch (err) {
      console.error("❌ Error en buscarDespachos:", err);
      setError(
        err instanceof Error ? err.message : "Error al buscar despachos"
      );
    } finally {
      setLoading(false);
    }
  }, [query, pagination.perPage, filtros]);

  // Efecto para búsqueda inicial
  useEffect(() => {
    buscarDespachos(undefined, 1);
  }, [buscarDespachos]);

  // Función para manejar la búsqueda con evento opcional
  const handleBuscar = (e?: React.FormEvent, page = 1) => {
    if (e) {
      e.preventDefault();
      buscarDespachos(e, page);
    } else {
      buscarDespachos(undefined, page);
    }
  };

  const handleImport = async (objectId: string) => {
    setImportando(objectId);
    
    try {
      if (onImport) {
        // Si hay un manejador de importación personalizado, usarlo
        const result = await onImport(objectId);
        if (result?.success) {
          toast.success("Despacho importado correctamente");
          // Cerrar el modal después de 1.5 segundos
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
        } else {
          throw new Error(result?.error || 'Error al importar el despacho');
        }
      } else {
        // Comportamiento por defecto si no hay manejador personalizado
        console.log("🔄 [Importar] Iniciando importación del despacho:", objectId);
        const response = await fetch("/api/despachos/wordpress/importar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ objectId }),
        });

        const data = await response.json();
        
        if (data.success) {
          console.log("✅ [Importar] Despacho importado correctamente:", data);
          toast.success("Despacho importado correctamente");
          // Cerrar el modal después de 1.5 segundos
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
          // Actualizar la lista después de importar
          buscarDespachos(undefined, pagination.page);
        } else {
          throw new Error(data.error || "Error desconocido al importar el despacho");
        }
      }
    } catch (error) {
      console.error("❌ [Importar] Error al importar el despacho:", error);
      toast.error(`Error al importar el despacho: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setImportando(null);
    }
  };

  // Eliminadas las funciones no utilizadas
  // handlePageChange y handleFilter

  const clearFilters = () => {
    setFiltros({ localidad: "", provincia: "" });
    // Usar un pequeño retraso para asegurar que el estado se actualice
    setTimeout(() => buscarDespachos(undefined, 1), 0);
  };

  // Función auxiliar para manejar la navegación de páginas
  const handleNextPage = () => {
    buscarDespachos(undefined, pagination.page + 1);
  };

  const handlePrevPage = () => {
    buscarDespachos(undefined, pagination.page - 1);
  };

  const handleLastPage = () => {
    buscarDespachos(undefined, pagination.totalPages);
  };

  return (
    <div className="mb-6">
      <form
        onSubmit={handleBuscar}
        className="flex flex-col sm:flex-row gap-4 items-center mb-4"
      >
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80 text-gray-900 placeholder-gray-500"
          placeholder="Buscar despacho por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          disabled={loading || !query}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}

      <div className="mt-4 max-h-[70vh] overflow-y-auto">
        {resultados.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="filtro-provincia"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Filtrar por provincia:
                  </label>
                  <select
                    id="filtro-provincia"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={filtros.provincia}
                    onChange={(e) => {
                      setFiltros((prev) => ({
                        ...prev,
                        provincia: e.target.value,
                        localidad: "",
                      }));
                    }}
                  >
                    <option value="">Todas las provincias</option>
                    {[
                      ...new Set(
                        resultados
                          .map(d => d.meta?._despacho_sedes?.[0]?.provincia)
                          .filter(Boolean)
                      ),
                    ].map((provincia) => (
                      <option key={provincia} value={provincia}>
                        {provincia}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filtro-localidad"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Filtrar por localidad:
                  </label>
                  <select
                    id="filtro-localidad"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={filtros.localidad}
                    onChange={(e) => {
                      setFiltros((prev) => ({
                        ...prev,
                        localidad: e.target.value,
                      }));
                    }}
                    disabled={!filtros.provincia}
                  >
                    <option value="">Todas las localidades</option>
                    {filtros.provincia &&
                      [
                        ...new Set(
                          resultados
                            .filter(d => d.meta?._despacho_sedes?.[0]?.provincia === filtros.provincia)
                            .map(d => d.meta?._despacho_sedes?.[0]?.localidad)
                            .filter(Boolean)
                        ),
                      ].map((localidad) => (
                        <option key={localidad} value={localidad}>
                          {localidad}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors h-[42px] w-full"
                    disabled={!filtros.localidad && !filtros.provincia}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    {pagination.total}{" "}
                    {pagination.total === 1 ? "resultado" : "resultados"}{" "}
                    encontrados
                  </h4>
                  {(filtros.provincia || filtros.localidad) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Filtrado por:
                      {filtros.provincia && `Provincia: ${filtros.provincia}`}
                      {filtros.localidad && `, Localidad: ${filtros.localidad}`}
                    </p>
                  )}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBuscar(undefined, 1)}
                      disabled={pagination.page === 1 || loading}
                      className="px-2 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={handlePrevPage}
                      disabled={pagination.page === 1 || loading}
                      className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                      title="Página anterior"
                    >
                      ‹ Anterior
                    </button>
                    <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                      className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                      title="Siguiente página"
                    >
                      Siguiente ›
                    </button>
                    <button
                      onClick={() =>
                        handleLastPage()
                      }
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                      className="px-2 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                      title="Última página"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>

              {/* Tabla de resultados */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provincia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultados.map((d) => (
                      <tr key={d.object_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="text-sm font-medium text-gray-900"
                            dangerouslySetInnerHTML={{ __html: d.title?.rendered || d.nombre || '' }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {d.meta?._despacho_sedes?.[0]?.localidad || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {d.meta?._despacho_sedes?.[0]?.provincia || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleImport(d.object_id || String(d.id || ''))}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={importando === (d.object_id || String(d.id || ''))}
                          >
                            Importar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? "Buscando despachos..." : "No se encontraron resultados"}
          </div>
        )}
      </div>
    </div>
  );
}

