"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import ModalAsignarPropietario from "@/components/ModalAsignarPropietario";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Función para decodificar entidades HTML
function decodeHtmlEntities(str: string) {
  if (!str) return '';
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
import { slugify } from "@/lib/slugify";

// ...existing code...
import BuscadorDespachosWordpress from "@/components/BuscadorDespachosWordpress";

type DespachoSummary = {
  id: string;
  object_id?: string;
  nombre: string;
  slug?: string;
  num_sedes: number;
  created_at: string;
  estado?: string;
  // Principal sede fields
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  // Owner fields
  owner_nombre?: string;
  owner_apellidos?: string;
  owner_email?: string;
};

const DespachosPage = () => {
  // Estado para búsqueda de usuario
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [asignarDespachoId, setAsignarDespachoId] = useState<string | null>(
    null
  );
  const [searchUser, setSearchUser] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Estado para modal de solicitar propiedad
  const [showSolicitarModal, setShowSolicitarModal] = useState(false);
  const [despachoSolicitar, setDespachoSolicitar] =
    useState<DespachoSummary | null>(null);
  const [solicitandoPropiedad, setSolicitandoPropiedad] = useState(false);
  const [mensajePropiedad, setMensajePropiedad] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<
    Set<string>
  >(new Set());

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
    
    try {
      // 1. Actualizar el owner_email en la tabla despachos
      const { error: updateError } = await supabase
        .from("despachos")
        .update({ owner_email: selectedUser.email })
        .eq("id", asignarDespachoId);
      
      if (updateError) throw updateError;
      
      // 2. Eliminar cualquier relación existente para este despacho
      const { error: deleteError } = await supabase
        .from("user_despachos")
        .delete()
        .eq("despacho_id", asignarDespachoId);
      
      if (deleteError) throw deleteError;
      
      // 3. Crear nueva relación en user_despachos
      const { error: insertError } = await supabase
        .from("user_despachos")
        .insert([
          {
            user_id: selectedUser.id,
            despacho_id: asignarDespachoId,
            fecha_asignacion: new Date().toISOString()
          }
        ]);
      
      if (insertError) throw insertError;
      
      // 4. Actualizar el despacho_nombre en el perfil del usuario
      const despacho = despachos.find(d => d.id === asignarDespachoId);
      if (despacho) {
        await supabase
          .from("users")
          .update({ despacho_nombre: despacho.nombre })
          .eq("id", selectedUser.id);
      }
      
      // Actualizar la UI
      setShowAsignarModal(false);
      setSelectedUser(null);
      setSearchUser("");
      await fetchDespachos();
      
    } catch (error: any) {
      console.error("Error al asignar propietario:", error);
      setUserError(`Error al asignar propietario: ${error?.message || 'Error desconocido'}`);
    } finally {
      setUserLoading(false);
    }
  };

  // Estado para controlar si ya se ha enviado una solicitud exitosa
  const [solicitudExitosa, setSolicitudExitosa] = useState(false);

  // Solicitar propiedad del despacho
  const handleSolicitarPropiedad = async () => {
    // Validar que tengamos los datos necesarios y que no haya una solicitud en curso o exitosa
    if (!despachoSolicitar || !user?.email || !user?.id || solicitandoPropiedad || solicitudExitosa) return;
    
    try {
      // Iniciar estado de carga
      setSolicitandoPropiedad(true);
      setMensajePropiedad(null);

      // Obtener datos completos del usuario
      const { data: userData } = await supabase
        .from("users")
        .select("nombre, apellidos")
        .eq("id", user.id)
        .single();

      // Crear solicitud pendiente de aprobación
      const { data: solicitudCreada, error } = await supabase
        .from("solicitudes_despacho")
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: userData
            ? `${userData.nombre || ""} ${userData.apellidos || ""}`.trim()
            : user.email,
          despacho_id: despachoSolicitar.object_id || despachoSolicitar.id,
          despacho_nombre: despachoSolicitar.nombre,
          despacho_localidad: despachoSolicitar.localidad,
          despacho_provincia: despachoSolicitar.provincia,
          estado: "pendiente",
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Solicitud creada:", solicitudCreada);

      // Marcar la solicitud como exitosa
      setSolicitudExitosa(true);

      // Enviar notificación al administrador (sin esperar respuesta)
      fetch("/api/notificar-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: solicitudCreada.id,
          userName: solicitudCreada.user_name,
          userEmail: solicitudCreada.user_email,
          despachoNombre: solicitudCreada.despacho_nombre,
          despachoLocalidad: solicitudCreada.despacho_localidad,
          despachoProvincia: solicitudCreada.despacho_provincia,
        }),
      }).catch(err => console.error("Error enviando notificación:", err));

      // Actualizar estado de solicitudes pendientes
      setSolicitudesPendientes(prev => {
        const nuevasSolicitudes = new Set(prev);
        nuevasSolicitudes.add(despachoSolicitar.id);
        return nuevasSolicitudes;
      });
      
      // Mostrar mensaje de éxito
      setMensajePropiedad({
        tipo: "success",
        texto: "✅ Solicitud enviada. Un administrador la revisará pronto.",
      });

      // Cerrar el modal después de 2 segundos
      setTimeout(async () => {
        // Actualizar las solicitudes pendientes antes de cerrar
        await cargarSolicitudesPendientes();
        
        setShowSolicitarModal(false);
        setDespachoSolicitar(null);
        setMensajePropiedad(null);
        setSolicitudExitosa(false); // Resetear el estado al cerrar
      }, 2000);
      
    } catch (error: any) {
      console.error("Error al enviar solicitud:", error);
      setMensajePropiedad({
        tipo: "error",
        texto: `Error al enviar la solicitud: ${error.message || 'Inténtalo de nuevo más tarde'}`,
      });
    } finally {
      setSolicitandoPropiedad(false);
    }
  };
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<DespachoSummary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;
  const [loadingDespachos, setLoadingDespachos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch despachos con useCallback para evitar recreación en cada render
  const fetchDespachos = useCallback(async () => {
    if (!user) return;
    
    setLoadingDespachos(true);
    setError(null);
    
    try {
      // Construir la consulta base
      let query = supabase
        .from("despachos")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      
      // Aplicar filtro de búsqueda si existe
      if (search) {
        query = query.ilike("nombre", `%${search}%`);
      }
      
      // Ejecutar la consulta
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Mapear los datos de los despachos
        const mapped = await Promise.all(
          data.map(async (d: any) => {
            let sedePrincipal = null;
            
            // Obtener sede principal si el despacho tiene ID
            if (d.id) {
              const { data: sedes, error: sedeError } = await supabase
                .from("sedes")
                .select("*")
                .eq("despacho_id", d.id)
                .eq("es_principal", true)
                .maybeSingle();
                
              if (sedeError) {
                console.warn(`⚠️ No se pudo obtener sede para despacho ${d.id}:`, sedeError.message);
              }
              
              sedePrincipal = sedes || null;
            }
            
            return {
              id: d.id,
              object_id: d.object_id,
              nombre: decodeHtmlEntities(d.nombre || ''),
              num_sedes: d.num_sedes || 0,
              created_at: d.created_at || new Date().toISOString(),
              estado: d.estado || 'activo',
              localidad: sedePrincipal?.localidad || "",
              provincia: sedePrincipal?.provincia || "",
              telefono: sedePrincipal?.telefono || "",
              email: sedePrincipal?.email_contacto || "",
              owner_email: d.owner_email || null,
            } as DespachoSummary;
          })
        );
        
        setDespachos(mapped);
        setTotal(count || 0);
      }
    } catch (error) {
      console.error("Error al cargar despachos:", error);
      setError("Error al cargar los despachos. Por favor, inténtalo de nuevo.");
      setDespachos([]);
      setTotal(0);
    } finally {
      setLoadingDespachos(false);
    }
  };

  // Función para cargar las solicitudes pendientes del usuario
  const cargarSolicitudesPendientes = useCallback(async () => {
    if (!user?.id) {
      console.log('No hay usuario, no se pueden cargar solicitudes pendientes');
      return;
    }
    
    console.log('Cargando solicitudes pendientes para el usuario:', user.id);
    
    try {
      // Obtener las solicitudes pendientes del usuario actual
      const { data: solicitudes, error } = await supabase
        .from('solicitudes_despacho')
        .select('despacho_id')
        .eq('user_id', user.id)
        .eq('estado', 'pendiente');

      if (error) throw error;

      console.log('Solicitudes pendientes encontradas:', solicitudes);

      if (solicitudes && solicitudes.length > 0) {
        // Extraer los IDs de los despachos con solicitud pendiente
        const idsPendientes = solicitudes.map(s => String(s.despacho_id));
        console.log('IDs de despachos con solicitud pendiente:', idsPendientes);
        
        // Actualizar el estado con los nuevos IDs
        setSolicitudesPendientes(new Set(idsPendientes));
      } else {
        console.log('No se encontraron solicitudes pendientes');
        setSolicitudesPendientes(new Set());
      }
    } catch (error) {
      console.error('Error cargando solicitudes pendientes:', error);
      setSolicitudesPendientes(new Set());
    }
  }, [user?.id]);

  // Cargar despachos y solicitudes pendientes cuando el usuario esté disponible
  useEffect(() => {
    if (!user) {
      console.log('Usuario no autenticado, no se pueden cargar datos');
      return;
    }
    
    console.log('Cargando datos para el usuario:', user.id);
    
    const cargarDatos = async () => {
      try {
        console.log('Iniciando carga de datos...');
        
        // Primero cargar las solicitudes pendientes
        await cargarSolicitudesPendientes();
        
        // Luego cargar los despachos
        await fetchDespachos();
        
        console.log('Datos cargados correctamente');
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    
    cargarDatos();
    
    // Limpiar el estado al desmontar el componente
    return () => {
      console.log('Limpiando estado de solicitudes pendientes');
      setSolicitudesPendientes(new Set());
    };
  }, [user, page, search, cargarSolicitudesPendientes, fetchDespachos]);

  // Calcular totalPages para la paginación
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    // ... (rest of the code remains the same)
      <ModalAsignarPropietario
        despachoId={asignarDespachoId}
        show={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        onAsignar={fetchDespachos}
      />

      {/* Modal para solicitar propiedad */}
      {showSolicitarModal && despachoSolicitar && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showSolicitarModal ? 'flex' : 'hidden'} items-center justify-center`}
          onClick={() => setShowSolicitarModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative"
            role="document"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSolicitarModal(false);
                setDespachoSolicitar(null);
                setMensajePropiedad(null);
              }}
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
                <strong>&quot;{despachoSolicitar?.nombre || 'este despacho'}&quot;</strong>?
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
                className={`mb-4 p-3 rounded ${mensajePropiedad?.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                role="alert"
              >
                {mensajePropiedad?.texto || 'Ha ocurrido un error'}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  if (solicitandoPropiedad) return;
                  setShowSolicitarModal(false);
                  setDespachoSolicitar(null);
                  setMensajePropiedad(null);
                  setSolicitudExitosa(false);
                }}
                disabled={solicitandoPropiedad || solicitudExitosa}
                className={`px-4 py-2 rounded ${
                  solicitandoPropiedad || solicitudExitosa
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {solicitandoPropiedad ? 'Espere...' : 'Cancelar'}
              </button>
              <button
                onClick={handleSolicitarPropiedad}
                disabled={solicitandoPropiedad || solicitudExitosa}
                className={`px-4 py-2 rounded flex items-center justify-center gap-2 min-w-[120px] ${
                  (solicitandoPropiedad || solicitudExitosa)
                    ? 'bg-green-500 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {solicitandoPropiedad ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-6 w-full">
        {/* Header */}
        <div className="mb-8">
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
        {(search || despachos.length > 0) && (
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
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 w-full sm:w-96 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar por nombre, localidad o provincia..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <div className="flex gap-2 items-center">
                  <button
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages || 1}
                  </span>
                  <button
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
              {loadingDespachos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando despachos...</p>
                </div>
              ) : error ? (
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
                          <td className="px-4 py-2 text-sm  text-gray-700 text-center">
                            {d.num_sedes}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {user?.role === "super_admin" || d.owner_email === user?.email ? (
                              d.owner_email ? (
                                <button
                                  onClick={async () => {
                                    const { data: userData } = await supabase
                                      .from("users")
                                      .select("id")
                                      .eq("email", d.owner_email)
                                      .single();

                                    if (userData?.id) {
                                      router.push(`/admin/users/${userData.id}`);
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
                            {(() => {
                              // Usar object_id para la comparación, ya que es el que se guarda en solicitudes_despacho
                              const despachoId = d.object_id ? String(d.object_id) : String(d.id);
                              // Verificar si hay alguna solicitud pendiente para este despacho
                              const tieneSolicitud = Array.from(solicitudesPendientes).some(
                                id => String(id) === despachoId
                              );
                              
                              console.log('Despacho:', {
                                id: d.id,
                                object_id: d.object_id,
                                nombre: d.nombre,
                                tieneSolicitud,
                                solicitudesPendientes: Array.from(solicitudesPendientes)
                              });
                              
                              // Si es admin o propietario, mostrar botón de editar
                              if (user?.role === "super_admin" || d.owner_email === user?.email) {
                                return (
                                  <button
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                                    onClick={() => {
                                      const slug = d.slug || slugify(d.nombre);
                                      router.push(`/dashboard/despachos/${slug}`);
                                    }}
                                  >
                                    Ver/Editar
                                  </button>
                                );
                              }
                              
                              // Si no tiene dueño
                              if (!d.owner_email) {
                                // Si ya tiene una solicitud pendiente
                                if (tieneSolicitud) {
                                  return (
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
                                  );
                                }
                                
                                // Si no tiene solicitud pendiente, mostrar botón para solicitar
                                return (
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
                                );
                              }
                              
                              // Por defecto, mostrar mensaje de sin permisos
                              return (
                                <span className="text-gray-400 text-xs italic">
                                  Sin permisos
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: ¿No encuentras tu despacho? */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¿No encuentras tu despacho?
            </h3>
            <p className="text-gray-700">
              Puedes importarlo desde nuestro directorio de Lexhoy.com o darlo
              de alta manualmente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Botón Importar desde Lexhoy.com */}
            <button
              onClick={() => {
                const modal = document.getElementById("modal-importar-lexhoy");
                if (modal) modal.classList.remove("hidden");
              }}
              className="group relative bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-4 mb-4 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
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
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Importar desde Lexhoy.com
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Busca tu despacho en nuestro directorio de más de 10,000
                  despachos jurídicos
                </p>
                <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                  Buscar e importar →
                </span>
              </div>
            </button>

            {/* Botón Dar de alta nuevo despacho */}
            <button
              onClick={() => router.push("/dashboard/despachos/nuevo")}
              className="group relative bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 group-hover:bg-green-200 rounded-full p-4 mb-4 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
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
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Dar de alta nuevo despacho
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Crea un despacho desde cero con toda la información necesaria
                </p>
                <span className="text-green-600 font-semibold text-sm group-hover:underline">
                  Crear despacho →
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal para importar desde Lexhoy.com */}
        <div
          id="modal-importar-lexhoy"
          className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
                <div>
                  <h2 className="text-2xl font-bold">
                    Importar Despacho desde Lexhoy.com
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Busca tu despacho en nuestro directorio
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const modal = document.getElementById(
                    "modal-importar-lexhoy"
                  );
                  if (modal) modal.classList.add("hidden");
                }}
                className="text-white hover:text-gray-200 transition-colors"
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
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">¿Cómo funciona?</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Busca tu despacho por nombre, localidad o provincia
                      </li>
                      <li>
                        Haz clic en &quot;Importar&quot; para añadirlo a la
                        plataforma
                      </li>
                      <li>
                        Una vez importado, aparecerá en la lista principal
                      </li>
                      <li>Podrás solicitar la propiedad para gestionarlo</li>
                    </ol>
                  </div>
                </div>
              </div>
              <BuscadorDespachosWordpress
                onImport={() => {
                  fetchDespachos();
                  const modal = document.getElementById(
                    "modal-importar-lexhoy"
                  );
                  if (modal) modal.classList.add("hidden");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DespachosPage;
