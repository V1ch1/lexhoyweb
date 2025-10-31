/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import ModalAsignarPropietario from "@/components/ModalAsignarPropietario";
import { DespachoSummary } from "@/types/despachos";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { DespachosListSkeleton } from "@/components/despachos/skeletons";
import { DespachosList } from "@/components/despachos/DespachosList";
import { DespachoNoEncontrado } from "@/components/despachos/DespachoNoEncontrado";

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


const DespachosPage = () => {
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

  // Solicitar propiedad del despacho
  const handleSolicitarPropiedad = async () => {
    if (!despachoSolicitar || !user?.email || !user?.id) return;
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
        despacho_id: despachoSolicitar.object_id || despachoSolicitar.id, // Usar object_id (WordPress ID)
        despacho_nombre: despachoSolicitar.nombre,
        despacho_localidad: despachoSolicitar.localidad,
        despacho_provincia: despachoSolicitar.provincia,
        estado: "pendiente",
      })
      .select()
      .single();

    console.log("✅ Solicitud creada:", solicitudCreada);

    if (error) {
      setMensajePropiedad({
        tipo: "error",
        texto: "Error al enviar solicitud: " + error.message,
      });
    } else {
      // Enviar notificación y email al super_admin
      try {
        await fetch("/api/notificar-solicitud", {
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
        });
      } catch (err) {
        console.error("Error enviando notificación:", err);
      }

      setMensajePropiedad({
        tipo: "success",
        texto: "✅ Solicitud enviada. Un administrador la revisará pronto.",
      });
      // Agregar a la lista de solicitudes pendientes
      setSolicitudesPendientes((prev) =>
        new Set(prev).add(despachoSolicitar.id)
      );
      setTimeout(() => {
        setShowSolicitarModal(false);
        setDespachoSolicitar(null);
        setMensajePropiedad(null);
      }, 3000);
    }
    setSolicitandoPropiedad(false);
  };
  const PAGE_SIZE = 20;
  const [loadingDespachos, setLoadingDespachos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch despachos con useEffect bien configurado
  const fetchDespachos = async () => {
    setLoadingDespachos(true);
    setError(null);
    
    try {
      // Obtener los despachos con el conteo actualizado
      let query = supabase
        .from("despachos")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
        
      if (search) {
        query = query.ilike("nombre", `%${search}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error al cargar despachos:", error);
        setError("Error al cargar los despachos: " + error.message);
        setDespachos([]);
        setTotal(0);
        setLoadingDespachos(false);
        return;
      }

      // Mapear los datos de los despachos
      const mapped = await Promise.all(
        (data || []).map(async (d: DespachoSummary) => {
          try {
            // Obtener el conteo real de sedes para este despacho
            const { count: conteoSedes } = await supabase
              .from('sedes')
              .select('*', { count: 'exact', head: true })
              .eq('despacho_id', d.id);

            const numSedes = conteoSedes || 0;
            
            // Si el conteo es diferente, actualizar el campo en la base de datos
            if (numSedes !== d.num_sedes) {
              await supabase
                .from('despachos')
                .update({ num_sedes: numSedes })
                .eq('id', d.id);
            }

            // Obtener la sede principal
            const { data: sedePrincipal } = await supabase
              .from("sedes")
              .select("*")
              .eq("despacho_id", d.id)
              .eq("es_principal", true)
              .maybeSingle();

            return {
              id: d.id,
              object_id: d.object_id,
              nombre: decodeHtmlEntities(d.nombre),
              num_sedes: numSedes,
              created_at: d.created_at,
              estado: d.estado,
              localidad: sedePrincipal?.localidad || "",
              provincia: sedePrincipal?.provincia || "",
              telefono: sedePrincipal?.telefono || "",
              email: sedePrincipal?.email_contacto || "",
              owner_email: d.owner_email || null,
            };
          } catch (error) {
            console.error(`Error procesando despacho ${d.id}:`, error);
            return {
              id: d.id,
              object_id: d.object_id,
              nombre: decodeHtmlEntities(d.nombre),
              num_sedes: d.num_sedes || 0,
              created_at: d.created_at,
              estado: d.estado,
              localidad: "",
              provincia: "",
              telefono: "",
              email: "",
              owner_email: d.owner_email || null,
            };
          }
      })
    );
      setDespachos(mapped);
      setTotal(count || 0);
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
              <button
                onClick={() => {
                  setShowSolicitarModal(false);
                  setDespachoSolicitar(null);
                  setMensajePropiedad(null);
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

        <DespachoNoEncontrado onImportSuccess={fetchDespachos} />
      </div>
    </>
  );
};

export default DespachosPage;
