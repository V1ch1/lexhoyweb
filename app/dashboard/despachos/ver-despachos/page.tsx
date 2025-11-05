/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import ModalAsignarPropietario from "@/components/ModalAsignarPropietario";
import { DespachoSummary } from "@/types/despachos";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { DespachosListSkeleton } from "@/components/despachos/skeletons";
import { DespachosList } from "@/components/despachos/DespachosList";

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  despacho_id?: string;
}

// Utilidad para decodificar entidades HTML
function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return str
    .replace(/&#([0-9]{1,4});/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–");
}
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

// ...existing code...
import BuscadorDespachosWordpress from "@/components/BuscadorDespachosWordpress";


const VerDespachosPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Estados principales
  const [despachos, setDespachos] = useState<DespachoSummary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Estado para búsqueda de usuario
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [asignarDespachoId, setAsignarDespachoId] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState<string>("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estado para modal de solicitar propiedad
  const [showSolicitarModal, setShowSolicitarModal] = useState(false);
  const [despachoSolicitar, setDespachoSolicitar] = useState<DespachoSummary | null>(null);
  const [solicitandoPropiedad, setSolicitandoPropiedad] = useState(false);
  const [mensajePropiedad, setMensajePropiedad] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Set<string>>(new Set());
  
  // Cargar solicitudes pendientes del usuario actual
  useEffect(() => {
    const fetchSolicitudesPendientes = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('solicitudes_despacho')
          .select('despacho_id')
          .eq('user_id', user.id)
          .eq('estado', 'pendiente');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const despachosIds = data.map(s => s.despacho_id);
          setSolicitudesPendientes(new Set(despachosIds));
        }
      } catch (error) {
        console.error('Error al cargar solicitudes pendientes:', error);
      }
    };
    
    fetchSolicitudesPendientes();
  }, [user?.id]);
  
  // Función para actualizar las solicitudes pendientes
  const actualizarSolicitudesPendientes = (despachoId: string) => {
    setSolicitudesPendientes(prev => new Set(prev).add(despachoId));
  };

  // Buscar usuarios en tiempo real por email o nombre de despacho
  useEffect(() => {
    if (!showAsignarModal || !searchUser) {
      setUserResults([]);
      return;
    }
    setUserLoading(true);
    setUserError(null);
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, nombre, apellidos, despacho_nombre")
        .or(
          `email.ilike.%${searchUser}%,nombre.ilike.%${searchUser}%,despacho_nombre.ilike.%${searchUser}%`
        )
        .limit(10);
      if (error) {
        setUserError("Error al buscar usuarios");
        setUserResults([]);
      } else {
        setUserResults(data || []);
      }
      setUserLoading(false);
    };
    fetchUsers();
  }, [searchUser, showAsignarModal]);

  // Asignar propietario
  const handleAsignarPropietario = async () => {
    if (!selectedUser || !asignarDespachoId) return;
    setUserLoading(true);
    setUserError(null);
    const { error } = await supabase
      .from("despachos")
      .update({ owner_email: selectedUser.email })
      .eq("id", asignarDespachoId);
    if (error) {
      setUserError("Error al asignar propietario");
    }
    setShowAsignarModal(false);
    setSelectedUser(null);
    setSearchUser("");
    fetchDespachos();
    setUserLoading(false);
  };

  // Solicitar propiedad del despacho (con importación automática si es necesario)
  const handleSolicitarPropiedad = async () => {
    if (!despachoSolicitar || !user?.email || !user?.id || solicitandoPropiedad) return;
    
    setSolicitandoPropiedad(true);
    setMensajePropiedad(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No hay sesión activa");
      }

      // Usar el nuevo endpoint inteligente que importa si es necesario
      const response = await fetch("/api/despachos/solicitar-propiedad-inteligente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          despachoId: despachoSolicitar.id,
          origen: (despachoSolicitar as any).origen || "supabase",
          wordpressId: (despachoSolicitar as any).wordpress_id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al procesar solicitud");
      }

      console.log("✅ Solicitud procesada:", result);

      // Actualizar el estado de solicitudes pendientes
      actualizarSolicitudesPendientes(result.despachoId);
      
      // Mostrar mensaje de éxito
      setMensajePropiedad({
        tipo: "success",
        texto: result.importado 
          ? "Despacho importado y solicitud enviada correctamente. Te notificaremos cuando sea revisada."
          : "Solicitud enviada correctamente. Te notificaremos cuando sea revisada.",
      });

      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        setShowSolicitarModal(false);
        setDespachoSolicitar(null);
        setMensajePropiedad(null);
        // Recargar despachos para mostrar el recién importado
        fetchDespachos();
      }, 2000);
      
    } catch (err) {
      console.error("Error al enviar la solicitud:", err);
      setMensajePropiedad({
        tipo: "error",
        texto: err instanceof Error ? err.message : "Error al enviar la solicitud. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setSolicitandoPropiedad(false);
    }
  };
  const PAGE_SIZE = 20;
  const [loadingDespachos, setLoadingDespachos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch despachos con búsqueda unificada (Supabase + WordPress)
  const fetchDespachos = async () => {
    setLoadingDespachos(true);
    setError(null);
    
    try {
      if (!user?.id) {
        setDespachos([]);
        setTotal(0);
        setLoadingDespachos(false);
        return;
      }

      // Usar el nuevo endpoint de búsqueda unificada
      const response = await fetch(
        `/api/despachos/buscar-unificado?query=${encodeURIComponent(search)}&page=${page}&perPage=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error("Error al buscar despachos");
      }

      const { data, pagination } = await response.json();

      // Obtener los IDs de despachos del usuario
      const { data: userDespachosData } = await supabase
        .from("user_despachos")
        .select("despacho_id")
        .eq("user_id", user.id);

      const userDespachoIds = new Set(userDespachosData?.map(ud => ud.despacho_id) || []);

      // Mapear los datos (ya vienen formateados del endpoint)
      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        wordpress_id: d.wordpress_id,
        nombre: decodeHtmlEntities(d.nombre),
        num_sedes: d.num_sedes || 0,
        localidad: d.localidad || "",
        provincia: d.provincia || "",
        telefono: d.telefono || "",
        email: d.email || "",
        origen: d.origen, // 'supabase' o 'wordpress'
        yaImportado: d.yaImportado, // true o false
        isOwner: d.origen === 'supabase' && userDespachoIds.has(d.id),
      }));

      setDespachos(mapped);
      setTotal(pagination.total || 0);
    } catch (error) {
      console.error("Error al cargar despachos:", error);
      setError("Error al cargar los despachos. Por favor, intente de nuevo.");
    } finally {
      setLoadingDespachos(false);
    }
  };

  // useEffect: llama a fetchDespachos cuando user está cargado y cambia page/search
  useEffect(() => {
    if (!user) return;
    fetchDespachos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, search]);

  // Calcular totalPages para la paginación
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <ModalAsignarPropietario
        despachoId={asignarDespachoId}
        show={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        onAsignar={fetchDespachos}
      />

      {/* Modal para solicitar propiedad */}
      {showSolicitarModal && despachoSolicitar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowSolicitarModal(false);
                setDespachoSolicitar(null);
                setMensajePropiedad(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Solicitar Propiedad
            </h3>
            <p className="text-gray-700 mb-4">
              ¿Deseas solicitar la propiedad del despacho{" "}
              <strong>&quot;{despachoSolicitar.nombre}&quot;</strong>?
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📋 Proceso de aprobación:</strong>
                <br />
                Tu solicitud será revisada por un administrador. Recibirás una
                notificación cuando sea aprobada o rechazada.
              </p>
            </div>

            {mensajePropiedad && (
              <div
                className={`mb-4 p-3 rounded ${mensajePropiedad.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {mensajePropiedad.texto}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {mensajePropiedad?.tipo !== "success" ? (
                <>
                  <button
                    onClick={() => {
                      if (!solicitandoPropiedad) {
                        setShowSolicitarModal(false);
                        setDespachoSolicitar(null);
                        setMensajePropiedad(null);
                      }
                    }}
                    disabled={solicitandoPropiedad}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSolicitarPropiedad}
                    disabled={solicitandoPropiedad}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {solicitandoPropiedad ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowSolicitarModal(false);
                    setDespachoSolicitar(null);
                    setMensajePropiedad(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-6 w-full">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/despachos')}
            className="mb-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Despachos
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {user?.role === "super_admin"
              ? "Gestión de Despachos"
              : "Buscar Mi Despacho"}
          </h1>
          <p className="text-lg text-gray-600">
            {user?.role === "super_admin"
              ? "Gestiona todos los despachos jurídicos de la plataforma"
              : "Encuentra tu despacho en nuestro directorio y solicita la propiedad"}
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Despachos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingDespachos ? "..." : total}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Activos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingDespachos
                    ? "..."
                    : despachos.filter((d) => d.estado === "activo").length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Con Propietario
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingDespachos
                    ? "..."
                    : despachos.filter((d) => d.owner_email).length}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
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
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Tu Rol</p>
                <p className="text-lg font-bold text-gray-900">
                  {user?.role === "super_admin"
                    ? "Super Admin"
                    : "Despacho Admin"}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sección principal: Lista de Despachos - Solo si hay búsqueda o hay despachos */}
        <DespachosList
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          loadingDespachos={loadingDespachos}
          fetchDespachos={fetchDespachos}
          error={error}
          despachos={despachos}
          user={user}
          setAsignarDespachoId={setAsignarDespachoId}
          setShowAsignarModal={setShowAsignarModal}
          solicitudesPendientes={solicitudesPendientes}
          setDespachoSolicitar={setDespachoSolicitar}
          setShowSolicitarModal={setShowSolicitarModal}
        />

        {/* Mostrar botón de crear despacho solo si no hay resultados */}
        {!loadingDespachos && despachos.length === 0 && search && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No encontramos tu despacho
              </h3>
              <p className="text-gray-700 mb-6">
                Puedes darlo de alta manualmente con toda la información necesaria
              </p>
              <button
                onClick={() => router.push("/dashboard/despachos/crear")}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
                Dar de Alta Nuevo Despacho
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerDespachosPage;
