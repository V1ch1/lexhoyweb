import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { DespachosListSkeleton } from "./skeletons";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DespachosListProps {
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  totalPages: number;
  loadingDespachos: boolean;
  error: string | null;
  despachos: Array<{
    id: string;
    object_id?: string;
    nombre: string;
    slug?: string;
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
    num_sedes: number;
    owner_email?: string;
  }>;
  user: {
    role?: string;
    email?: string;
  } | null;
  setAsignarDespachoId: (id: string) => void;
  setShowAsignarModal: (show: boolean) => void;
  solicitudesPendientes: Set<string>;
  setDespachoSolicitar: (despacho: {
    id: string;
    object_id?: string;
    nombre: string;
    slug?: string;
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
    num_sedes: number;
    owner_email?: string;
  }) => void;
  setShowSolicitarModal: (show: boolean) => void;
}

export function DespachosList({
  search,
  setSearch,
  page,
  setPage,
  totalPages,
  loadingDespachos,
  error,
  despachos,
  user,
  setAsignarDespachoId,
  setShowAsignarModal,
  solicitudesPendientes,
  setDespachoSolicitar,
  setShowSolicitarModal,
}: DespachosListProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearch = () => {
    setSearch(localSearch);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Si está cargando, mostrar el skeleton independientemente de si hay búsqueda o no
  if (loadingDespachos) {
    return <DespachosListSkeleton />;
  }

  // Si no hay búsqueda y no hay despachos, no mostrar nada
  if (!search && despachos.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Despachos Disponibles
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === "super_admin"
                ? "Gestiona todos los despachos de la plataforma"
                : "Solicita la propiedad de tu despacho o gestiona los que ya tienes asignados"}
            </p>
          </div>
        </div>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="flex w-full max-w-2xl">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por nombre, localidad o provincia..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="ml-1 hidden sm:inline">Buscar</span>
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages || 1}
            </span>
            <button
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Siguiente
            </button>
          </div>
        </div>
        {error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : despachos.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-600 text-lg font-medium mb-2">
              No se encontraron despachos
            </p>
            <p className="text-gray-500 text-sm">
              Intenta con otros términos de búsqueda o importa tu despacho
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Localidad
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Provincia
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Teléfono
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nº Sedes
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Propietario
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {despachos.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {d.nombre}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {d.localidad || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {d.provincia || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {d.telefono || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {d.email || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                      {d.num_sedes}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {user?.role === "super_admin" || d.owner_email === user?.email ? (
                        d.owner_email ? (
                          <button
                            onClick={async () => {
                              if (!d.owner_email) return;
                              
                              try {
                                const { data: userData, error } = await supabase
                                  .from("users")
                                  .select("id")
                                  .eq("email", d.owner_email)
                                  .single();

                                if (error) throw error;

                                if (userData?.id) {
                                  router.push(`/admin/users/${userData.id}`);
                                }
                              } catch (error) {
                                console.error("Error fetching user data:", error);
                              }
                            }}
                            className="text-blue-600 underline hover:text-blue-800 font-semibold flex items-center gap-2"
                            title={`Ir a ficha de propietario (${d.owner_email})`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 inline"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {d.owner_email}
                          </button>
                        ) : user?.role === "super_admin" ? (
                          <button
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 font-semibold flex items-center gap-1"
                            onClick={() => {
                              setAsignarDespachoId(d.id);
                              setShowAsignarModal(true);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Añadir
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            Sin propietario
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          {d.owner_email ? 'Asignado' : 'Sin asignar'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {user?.role === "super_admin" ||
                      d.owner_email === user?.email ? (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                          onClick={() => {
                            const slug = d.slug || slugify(d.nombre);
                            router.push(`/dashboard/despachos/${slug}`);
                          }}
                        >
                          Ver/Editar
                        </button>
                      ) : !d.owner_email ? (
                        solicitudesPendientes.has(d.id) ? (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Pendiente
                          </span>
                        ) : (
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs font-semibold flex items-center gap-1"
                            onClick={() => {
                              setDespachoSolicitar(d);
                              setShowSolicitarModal(true);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Solicitar Propiedad
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Sin permisos
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
