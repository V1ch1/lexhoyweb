"use client";

import { useState, useEffect } from "react";

// Tipos de datos
interface Ubicacion {
  localidad?: string;
  provincia?: string;
  direccion?: string;
  codigo_postal?: string;
  [key: string]: any;
}

interface Sede extends Ubicacion {
  // Puedes añadir más campos específicos de sede si es necesario
}

interface MetaData extends Ubicacion {
  _despacho_sedes?: Sede[];
  [key: string]: any;
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
  onImport?: (objectId: string) => void;
}

export default function BuscadorDespachosWordpress({ onImport }: Props) {
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
  const [importResult, setImportResult] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    despacho?: {
      id: string | number;
      wp_id: string | number;
      titulo: string;
      contenido: string;
      estado: string;
      fecha_publicacion: string;
      actualizado_en: string;
      [key: string]: unknown;
    };
    message?: string;
    error?: string;
  } | null>(null);

  // Buscar despachos en WordPress usando la API real
  const buscarDespachos = async (
    e: React.FormEvent | null,
    page: number = 1
  ) => {
    e?.preventDefault?.();
    setLoading(true);
    setError(null);
    setImportResult({});

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

      const res = await fetch(`/api/search-despachos?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al buscar despachos");
      }

      const response = await res.json();
      console.log("📊 Resultados:", response);

      // Actualizar la paginación con la respuesta del servidor
      setPagination((prev) => ({
        ...prev,
        page: response.pagination?.page || page,
        total: response.pagination?.total || response.length || 0,
        totalPages: response.pagination?.totalPages || 1,
        perPage: response.pagination?.perPage || prev.perPage,
      }));

      const data = response.data || response;

      if (!data || data.length === 0) {
        setError("No se encontraron despachos con los filtros actuales");
        setResultados([]);
        return;
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
  };

  // Resto del código de importación...

  // Efecto para buscar cuando cambian los filtros
  useEffect(() => {
    if (resultados.length > 0) {
      buscarDespachos(null, 1);
    }
  }, [filtros.localidad, filtros.provincia]);

  return (
    <div className="mb-6">
      <form
        onSubmit={(e) => buscarDespachos(e, 1)}
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
                        resultados.map((d) => d.provincia || "").filter(Boolean)
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
                            .filter((d) => d.provincia === filtros.provincia)
                            .map((d) => d.localidad || "")
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
                    onClick={() => {
                      setFiltros({ localidad: "", provincia: "" });
                    }}
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
                      onClick={() => buscarDespachos(null, 1)}
                      disabled={pagination.page === 1 || loading}
                      className="px-2 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => buscarDespachos(null, pagination.page - 1)}
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
                      onClick={() => buscarDespachos(null, pagination.page + 1)}
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
                        buscarDespachos(null, pagination.totalPages)
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
                          <div className="text-sm font-medium text-gray-900">
                            {d.title?.rendered || d.nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {d.localidad || d.ubicacion?.localidad || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {d.provincia || d.ubicacion?.provincia || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => importarDespacho(d.object_id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={importando === d.object_id}
                          >
                            {importando === d.object_id
                              ? "Importando..."
                              : "Importar"}
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

// Función auxiliar para importar despachos (debes implementarla según tus necesidades)
async function importarDespacho(objectId: string) {
  // Implementa la lógica de importación aquí
  console.log("Importando despacho:", objectId);
}
