import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { DespachosListSkeleton } from "./skeletons";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { DespachoSummary } from "@/types/despachos";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DespachosListProps {
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  totalPages: number;
  loadingDespachos: boolean;
  error: string | null;
  despachos: DespachoSummary[];
  user: {
    role?: string;
    email?: string;
  } | null;
  setAsignarDespachoId: (id: string) => void;
  setShowAsignarModal: (show: boolean) => void;
  solicitudesPendientes: Set<string>;
  setDespachoSolicitar: React.Dispatch<
    React.SetStateAction<DespachoSummary | null>
  >;
  setShowSolicitarModal: (show: boolean) => void;
  fetchDespachos: () => Promise<void>;
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
  fetchDespachos,
}: DespachosListProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [despachoToDelete, setDespachoToDelete] =
    useState<DespachoSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearch = () => {
    setSearch(localSearch);
    setPage(1);
  };

  const handleDeleteClick = (despacho: DespachoSummary) => {
    setDespachoToDelete(despacho);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!despachoToDelete) return;
    
    setIsDeleting(true);
    try {
      // Usamos la función RPC segura
      const { data, error } = await supabase
        .rpc('eliminar_despacho_seguro', { 
          despacho_id_param: despachoToDelete.id 
        });

      if (error) {
        console.error('Error al llamar a la función de eliminación segura:', error);
        throw new Error('No se pudo completar la eliminación.');
      }

      if (data && !data.success) {
        console.error('Error en la función de eliminación segura:', data.error);
        throw new Error(data.error || 'Error al eliminar el despacho.');
      }

      // 4. Actualizamos la lista
      await fetchDespachos();
      setShowDeleteConfirm(false);
      
    } catch (error: unknown) {
      console.error('Error al eliminar el despacho:', error);
      
      // Mensaje de error más específico
      let errorMessage = 'No se pudo eliminar el despacho. ';
      
      if (error && typeof error === 'object') {
        const errorObj = error as { message?: string; code?: string };
        
        if (errorObj.message) {
          errorMessage = errorObj.message;
        }
        
        if (errorObj.code === '23503') { // Violación de clave foránea
          errorMessage = 'No se puede eliminar porque hay registros relacionados.';
        } else if (errorObj.code === '42703') { // Columna no existe
          errorMessage = 'Error en la base de datos. Contacta al administrador.';
        } else {
          errorMessage = errorObj.message || errorMessage;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
      setDespachoToDelete(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Si está cargando, mostrar el skeleton
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
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
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 min-w-[180px]">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Localidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Provincia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 min-w-[200px]">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Nº Sedes
                  </th>
                  {user?.role === 'super_admin' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Propietario
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {despachos.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{d.nombre}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 truncate max-w-[100px]">{d.localidad || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 truncate max-w-[100px]">{d.provincia || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{d.telefono || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 truncate max-w-[180px]">{d.email || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 h-5">
                          {d.num_sedes}
                        </span>
                      </div>
                    </td>

                    {user?.role === 'super_admin' && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {d.owner_email ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
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
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1.5 group"
                                title={`Ir a ficha de propietario (${d.owner_email})`}
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-blue-600"
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
                                </div>
                                <span className="truncate max-w-[120px]">
                                  {d.owner_email}
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setAsignarDespachoId(d.id);
                                  setShowAsignarModal(true);
                                }}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Cambiar propietario"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAsignarDespachoId(d.id);
                                setShowAsignarModal(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 mr-1"
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
                              Asignar dueño
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex justify-end pr-2">
                        {user?.role === "super_admin" || d.isOwner ? (
                          <div className="flex space-x-3">
                            <button
                              className="text-gray-600 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors text-sm flex items-center"
                              onClick={() => {
                                const slug = d.slug || slugify(d.nombre);
                                router.push(`/dashboard/despachos/${slug}?edit=true`);
                              }}
                              title="Editar despacho"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                              Editar
                            </button>
                            {user?.role === "super_admin" && (
                              <button
                                onClick={() => handleDeleteClick(d)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-white hover:bg-red-600 p-1.5 rounded-md transition-colors text-sm flex items-center border border-red-200 hover:border-transparent"
                                title="Eliminar despacho"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Eliminar
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setDespachoSolicitar(d);
                              setShowSolicitarModal(true);
                            }}
                            disabled={solicitudesPendientes.has(d.id)}
                            className={`text-sm ${
                              solicitudesPendientes.has(d.id)
                                ? "text-gray-500 cursor-not-allowed"
                                : "text-blue-600 hover:text-blue-800"
                            }`}
                            title={
                              solicitudesPendientes.has(d.id)
                                ? "Solicitud de propiedad ya enviada"
                                : "Solicitar propiedad de este despacho"
                            }
                          >
                            {solicitudesPendientes.has(d.id) ? (
                              <span className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-green-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Solicitud enviada
                              </span>
                            ) : (
                              "Solicitar propiedad"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar despacho?"
        message={
          <div className="space-y-2">
            <p>¿Estás seguro de que deseas eliminar el despacho <span className="font-semibold">{despachoToDelete?.nombre}</span>?</p>
            <p className="text-red-600 text-sm">Esta acción no se puede deshacer y eliminará todas las sedes asociadas.</p>
            <p className="text-sm text-gray-600 mt-2">Escribe <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Eliminar</span> para confirmar la eliminación.</p>
          </div>
        }
        confirmText={isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
        cancelText="Cancelar"
        isProcessing={isDeleting}
        requireConfirmationText={{
          textToMatch: 'Eliminar',
          placeholder: 'Escribe "Eliminar" para confirmar'
        }}
      />
    </div>
  );
}
