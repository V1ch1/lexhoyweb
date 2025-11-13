"use client";

/**
 * @module components/BuscadorDespachosWordpress
 * @description Componente para buscar y gestionar despachos de WordPress
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BusquedaDespachosResponse,
  DespachoWP as BaseDespachoWP,
} from "@/types/wordpress";
import { LocalDespachoWP, BuscadorDespachosProps } from "@/types/despachos";

/**
 * Componente para buscar y gestionar despachos desde WordPress
 *
 * @component
 * @example
 * ```tsx
 * <BuscadorDespachosWordpress
 *   onImport={async (id) => {
 *     // Lógica de importación
 *     return { success: true };
 *   }}
 *   onClose={() => // Estado para la paginación
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

  const [resultados, setResultados] = useState<LocalDespachoWP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState<string | null>(null);
  const [importedOffices, setImportedOffices] = useState<Set<string>>(
    new Set()
  );
  // Eliminado: ya no usamos importResult ya que usamos toast
  const [, setImportSummary] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  /**
   * Realiza una búsqueda de despachos en WordPress
   * @param {React.FormEvent} [e] - Evento del formulario (opcional)
   * @param {number} [page=1] - Página actual de resultados
   * @param {Object} [filters] - Filtros de búsqueda
   * @param {string} [filters.localidad] - Filtrar por localidad
   * @param {string} [filters.provincia] - Filtrar por provincia
   * @returns {Promise<void>}
   * @private
   */
  const buscarDespachos = useCallback(
    async (
      e?: React.FormEvent,
      page = 1,
      filters = filtros // Permitir sobrescribir los filtros
    ) => {
      e?.preventDefault?.();
      setLoading(true);
      setError(null);
      setImportSummary(null);

      try {
        // Construir los parámetros de búsqueda
        const params = new URLSearchParams({
          query: query || "",
          page: page.toString(),
          perPage: pagination.perPage.toString(),
          ...(filters.localidad && { localidad: filters.localidad }),
          ...(filters.provincia && { provincia: filters.provincia }),
        });

        const res = await fetch(
          `/api/despachos/wordpress/buscar?${params.toString()}`
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            typeof errorData?.message === "string"
              ? errorData.message
              : "Error al buscar despachos en WordPress"
          );
        }

        const response: BusquedaDespachosResponse = await res.json();
        // Actualizar la paginación con la respuesta del servidor
        const paginationData = response.pagination || {
          page,
          total: response.data?.length || 0,
          totalPages: 1,
          perPage: pagination.perPage,
        };

        setPagination((prev) => ({
          ...prev,
          ...paginationData,
        }));

        // Usar data de la respuesta
        const data = response.data;

        if (!data || data.length === 0) {
          setError("No se encontraron despachos con los filtros actuales");
          setResultados([]);
          return;
        }

        // Asegurarse de que cada despacho tenga un object_id
        const processedData = data.map((item: BaseDespachoWP) => {
          const itemWithMeta = item as BaseDespachoWP & {
            object_id?: string;
            nombre?: string;
            localidad?: string;
            provincia?: string;
            email_contacto?: string;
            telefono?: string;
          };

          return {
            ...item,
            object_id:
              itemWithMeta.object_id ||
              item.id?.toString() ||
              String(Math.random()),
            title: { 
              rendered: itemWithMeta.nombre || item.title?.rendered || "Sin nombre" 
            },
            meta: {
              ...item.meta,
              localidad: itemWithMeta.localidad || item.meta?.localidad || "",
              provincia: itemWithMeta.provincia || item.meta?.provincia || "",
              email_contacto: itemWithMeta.email_contacto || item.meta?.email_contacto || "",
              telefono: itemWithMeta.telefono || item.meta?.telefono || "",
              _despacho_sedes: item.meta?._despacho_sedes || []
            }
          } as unknown as LocalDespachoWP;
        });

        // Los filtros ya se aplican en el servidor, no es necesario filtrar aquí

        setResultados(processedData);
      } catch (err) {
        console.error("❌ Error en buscarDespachos:", err);
        setError(
          err instanceof Error ? err.message : "Error al buscar despachos"
        );
      } finally {
        setLoading(false);
      }
    },
    [query, pagination.perPage, filtros]
  );

  /**
   * Manejador de envío del formulario de búsqueda
   * @param e - Evento del formulario
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Solo busca si hay un término de búsqueda o filtros activos
    if (query.trim() || filtros.localidad || filtros.provincia) {
      buscarDespachos(e, 1, { ...filtros });
    } else {
      toast.info(
        "Por favor, introduce un término de búsqueda o selecciona algún filtro"
      );
      setError("Por favor, introduce un término de búsqueda");
    }
  };

  /**
   * Verifica si un despacho ya ha sido importado
   * @param {string} objectId - ID del objeto a verificar
   * @returns {Promise<boolean>} true si ya está importado, false en caso contrario
   * @private
   */
  const checkIfImported = useCallback(
    async (objectId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/despachos/wordpress/check-imported?objectId=${objectId}`
        );
        if (!response.ok) return false;
        const data = await response.json();
        return data.isImported || false;
      } catch (error) {
        console.error(
          "Error al verificar si el despacho está importado:",
          error
        );
        return false;
      }
    },
    []
  );

  // Verificar si los despachos ya están importados cuando se cargan los resultados
  useEffect(() => {
    const checkImportedOffices = async () => {
      const imported = new Set<string>();
      for (const despacho of resultados) {
        if (despacho.object_id) {
          const isImported = await checkIfImported(despacho.object_id);
          if (isImported) {
            imported.add(despacho.object_id);
          }
        }
      }
      setImportedOffices(imported);
    };

    if (resultados.length > 0) {
      checkImportedOffices();
    }
  }, [resultados, checkIfImported]);

  /**
   * Maneja la importación de un despacho
   * @param {string} objectId - ID del despacho a importar
   * @returns {Promise<void>}
   */
  const handleImport = async (objectId: string) => {
    if (importedOffices.has(objectId)) {
      toast.error("Este despacho ya ha sido importado");
      return;
    }

    setImportando(objectId);

    try {
      if (onImport) {
        // Si hay un manejador de importación personalizado, usarlo
        const result = await onImport(objectId);
        if (result?.success) {
          toast.success("Despacho importado correctamente");
          // Actualizar el estado de importados
          setImportedOffices((prev) => new Set(prev).add(objectId));
          // Llamar al callback de éxito
          if (onImportSuccess) onImportSuccess();
          // Cerrar el modal después de 1.5 segundos
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
        } else {
          throw new Error(result?.error || "Error al importar el despacho");
        }
      } else {
        // Comportamiento por defecto si no hay manejador personalizado
        const response = await fetch("/api/despachos/wordpress/importar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ objectId }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Despacho importado correctamente");
          // Actualizar el estado de importados
          setImportedOffices((prev) => new Set(prev).add(objectId));
          // Llamar al callback de éxito
          if (onImportSuccess) onImportSuccess();
          // Cerrar el modal después de 1.5 segundos
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
          // Actualizar la lista después de importar
          buscarDespachos(undefined, pagination.page);
        } else {
          throw new Error(
            data.error || "Error desconocido al importar el despacho"
          );
        }
      }
    } catch (error) {
      console.error("❌ [Importar] Error al importar el despacho:", error);
      toast.error(
        `Error al importar el despacho: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setImportando(null);
    }
  };

  // Eliminadas las funciones no utilizadas
  // handlePageChange y handleFilter

  const clearFilters = () => {
    const newFilters = { localidad: "", provincia: "" };
    setFiltros(newFilters);
    // Realizar búsqueda automática al limpiar los filtros
    buscarDespachos(undefined, 1, newFilters);
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
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 items-center mb-4"
      >
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80 text-gray-900 placeholder-gray-500"
          placeholder="Buscar despacho por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Permitir búsqueda con Enter
            if (e.key === "Enter") {
              handleSubmit(e);
            }
          }}
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

      <div className="mt-4 max-h-[70vh] overflow-y-auto">
        {!query.trim() && resultados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ingresa un término de búsqueda para comenzar
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : resultados.length > 0 ? (
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
                      const newFilters = {
                        ...filtros,
                        provincia: e.target.value,
                        localidad: "",
                      };
                      setFiltros(newFilters);
                      // Realizar búsqueda automática al cambiar la provincia
                      buscarDespachos(undefined, 1, newFilters);
                    }}
                  >
                    <option value="">Todas las provincias</option>
                    {[
                      ...new Set(
                        resultados
                          .map((d) => d.meta?._despacho_sedes?.[0]?.provincia)
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
                      const newFilters = {
                        ...filtros,
                        localidad: e.target.value,
                      };
                      setFiltros(newFilters);
                      // Realizar búsqueda automática al cambiar la localidad
                      buscarDespachos(undefined, 1, newFilters);
                    }}
                    disabled={!filtros.provincia}
                  >
                    <option value="">Todas las localidades</option>
                    {filtros.provincia &&
                      [
                        ...new Set(
                          resultados
                            .filter(
                              (d) =>
                                d.meta?._despacho_sedes?.[0]?.provincia ===
                                filtros.provincia
                            )
                            .map((d) => d.meta?._despacho_sedes?.[0]?.localidad)
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
                  {/* {(filtros.provincia || filtros.localidad) && (
                    <p className="text-sm text-black mt-1">
                      Filtrado por: <br />
                      {filtros.provincia && ` Provincia: ${filtros.provincia}`}
                      {filtros.localidad &&
                        `,  Localidad: ${filtros.localidad}`}
                    </p>
                  )} */}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination((prev) => ({ ...prev, page: 1 }));
                        handleSubmit(e);
                      }}
                      disabled={pagination.page === 1 || loading}
                      className="px-2 py-1 rounded-md text-sm font-medium disabled:opacity-50 text-black"
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={handlePrevPage}
                      disabled={pagination.page === 1 || loading}
                      className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50  text-black"
                      title="Página anterior"
                    >
                      ‹ Anterior
                    </button>
                    <span className="px-3 py-1 text-sm bg-gray-100 rounded  text-black">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                      className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50  text-black"
                      title="Siguiente página"
                    >
                      Siguiente ›
                    </button>
                    <button
                      onClick={() => handleLastPage()}
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                      className="px-2 py-1 rounded-md text-sm font-medium disabled:opacity-50  text-black"
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
                            dangerouslySetInnerHTML={{
                              __html: d.title?.rendered || d.nombre || "",
                            }}
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
                          {importedOffices.has(
                            d.object_id || String(d.id || "")
                          ) ? (
                            <span className="text-green-600 font-medium">
                              Importado
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleImport(d.object_id || String(d.id || ""))
                              }
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={
                                importando ===
                                (d.object_id || String(d.id || ""))
                              }
                            >
                              {importando ===
                              (d.object_id || String(d.id || ""))
                                ? "Importando..."
                                : "Importar"}
                            </button>
                          )}
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
            {loading
              ? "Buscando despachos..."
              : query.trim() === ""
                ? "Ingresa un término de búsqueda para comenzar"
                : "No se encontraron resultados"}
          </div>
        )}
      </div>
    </div>
  );
}
