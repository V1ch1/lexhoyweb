"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserService } from "@/lib/userService";
import type { SolicitudRegistro } from "@/lib/types";

// Interfaces para las estadísticas
interface SystemStats {
  totalUsers: number;
  activeDespachos: number;
  totalLeads: number;
  usersByRole: {
    super_admin: number;
    despacho_admin: number;
    usuario: number;
  };
}

interface DespachoStats {
  leadsThisMonth: number;
  totalLeads: number;
  conversions: number;
}

// Página principal del Dashboard
const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [despachoStats, setDespachoStats] = useState<DespachoStats | null>(
    null
  );
  const [statsLoading, setStatsLoading] = useState(true);
  const [solicitudDespacho, setSolicitudDespacho] = useState<{
    despachoId: number;
    fecha: string;
    estado: string;
  } | null>(null);
  // Solicitudes pendientes para super_admin
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<
    number | null
  >(null);
  // Lista completa de solicitudes (solo super_admin)
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "super_admin") {
      setSolicitudesLoading(true);
      const userService = new UserService();
      userService
        .getAllSolicitudes()
        .then((data) => {
          const mapped = data.map((s: any) => ({
            id: s.id as string,
            user_id: s.user_id as string | undefined,
            user_email: s.user_email as string | undefined,
            user_name: s.user_name as string | undefined,
            despacho_id: s.despacho_id as string | undefined,
            despacho_nombre: s.despacho_nombre as string | undefined,
            despacho_localidad: s.despacho_localidad as string | undefined,
            despacho_provincia: s.despacho_provincia as string | undefined,
            estado: s.estado as "pendiente" | "aprobado" | "rechazado",
            fechaSolicitud: s.fecha_solicitud
              ? new Date(s.fecha_solicitud)
              : new Date(0),
            fechaRespuesta: s.fecha_respuesta
              ? new Date(s.fecha_respuesta)
              : undefined,
            respondidoPor: s.respondidoPor as string | undefined,
            notasRespuesta: s.notasRespuesta as string | undefined,
            userCreadoId: s.userCreadoId as string | undefined,
            despachoCreadoId: s.despachoCreadoId as string | undefined,
            email: s.email as string | undefined,
            nombre: s.nombre as string | undefined,
            apellidos: s.apellidos as string | undefined,
            telefono: s.telefono as string | undefined,
            empresa: s.empresa as string | undefined,
            mensaje: s.mensaje as string | undefined,
            datosDespacho:
              s.datosDespacho as SolicitudRegistro["datosDespacho"],
          }));
          setSolicitudes(mapped);
        })
        .catch(() => setSolicitudes([]))
        .finally(() => setSolicitudesLoading(false));
    }
  }, [user?.role]);
  // Función segura para obtener el JWT
  function getJWT() {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("supabase_jwt") || "";
    }
    return "";
  }
  // useEffect bloqueado: No cargar solicitud de despacho automáticamente
  // useEffect(() => {
  //   if (!user?.id || user.role !== "usuario") return;
  //   // Obtener el JWT de forma segura
  //   const token = getJWT();
  //   fetch(`/api/solicitudes-despacho?userId=${user.id}`, {
  //     headers: {
  //       'Authorization': `Bearer ${token}`
  //     }
  //   })
  //     .then((res) => res.json())
  //     .then((data: Array<{ estado: string; despachoId: number; fecha: string }>) => {
  //       const pendiente = data.find((s) => s.estado === "pendiente");
  //       setSolicitudDespacho(pendiente || null);
  //     })
  //     .catch(() => setSolicitudDespacho(null));
  // }, [user?.id, user?.role]);

  // Debug del usuario actual
  useEffect(() => {
    // ...existing code...
  }, [user]);

  // Cargar estadísticas según el rol del usuario
  useEffect(() => {
    if (!user?.id || !user?.role) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const userService = new UserService();
        if (user.role === "super_admin") {
          const stats = await userService.getSystemStats();
          setSystemStats(stats);
        } else if (user.role === "despacho_admin") {
          const stats = await userService.getDespachoStats(user.id);
          setDespachoStats(stats);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [user?.id, user?.role]);

  // Mostrar loading hasta que user y stats estén listos
  const statsReady =
    user &&
    ((user.role === "super_admin" && systemStats && !statsLoading) ||
      (user.role === "despacho_admin" && despachoStats && !statsLoading) ||
      user.role === "usuario");

  if (isLoading || !user || (user.role !== "usuario" && !statsReady)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Dashboard */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          {user.role === "super_admin" &&
            "Accede a la administración global de la plataforma."}
          {user.role === "despacho_admin" &&
            "Gestiona tu despacho y tus leads desde aquí."}
          {user.role === "usuario" &&
            "Tu cuenta está registrada. Solicita un despacho o espera asignación para acceder a más funciones."}
        </p>
        {user.role === "super_admin" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Accede al{" "}
              <button
                onClick={() => router.push("/admin/users")}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Panel de Administración
              </button>{" "}
              para gestionar usuarios y configuración avanzada.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Card de Solicitudes Pendientes (solo para super_admin) */}
        {/* Card de pendientes y tabla de solicitudes para super_admin */}
        {user.role === "super_admin" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-1 flex items-center gap-2">
                <span>Solicitudes de despacho pendientes</span>
                <span className="inline-block bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-sm font-bold">
                  {solicitudesLoading
                    ? "..."
                    : solicitudes.filter((s) => s.estado === "pendiente")
                        .length}
                </span>
              </h3>
              <p className="text-yellow-800 text-sm">
                Revisa y gestiona las solicitudes de vinculación de despachos.
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/users?tab=solicitudes")}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Ver solicitudes
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Bienvenida */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Bienvenido, {user.name.split(" ")[0]}!
            </h2>
            <p className="text-gray-600">
              {user.role === "super_admin" &&
                "Tienes acceso total a la administración y estadísticas globales."}
              {user.role === "despacho_admin" &&
                "Gestiona tu despacho, leads y perfil desde este panel."}
              {user.role === "usuario" &&
                "Solicita la creación de un despacho o espera asignación para acceder a más funciones."}
            </p>
          </div>
          {/* Card de Administración (solo para super_admin) */}
          {user.role === "super_admin" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Administración
              </h3>
              <p className="text-gray-600 mb-4">
                Gestiona usuarios y configuración del sistema
              </p>
              <button
                onClick={() => router.push("/admin/users")}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Panel Admin
              </button>
            </div>
          )}
          {/* Card de Solicitar Despacho (solo para usuarios básicos) */}
          {user.role === "usuario" && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Crear Despacho
                </h3>
                <p className="text-gray-600 mb-4">
                  ¿Tienes un despacho? Solicita la creación de tu despacho para
                  acceder a todas las funcionalidades.
                </p>
                <button
                  onClick={() => router.push("/dashboard/solicitar-despacho")}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Solicitar Despacho
                </button>
                {solicitudDespacho && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <span className="text-yellow-800 font-medium">
                      Solicitud pendiente
                    </span>
                    <br />
                    <span className="text-gray-700 text-sm">
                      Tu solicitud de despacho está pendiente de revisión por un
                      administrador.
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Estado de Cuenta
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rol actual:</span>
                    <span className="font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      Usuario
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-semibold bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Activo
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Espera a que un administrador te asigne a un despacho para
                  acceder a más funciones.
                </p>
              </div>
            </>
          )}
          {/* Card de Leads (solo para despacho_admin y super_admin) */}
          {(user.role === "despacho_admin" || user.role === "super_admin") && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Leads
              </h3>
              <p className="text-gray-600 mb-4">
                {user.role === "super_admin"
                  ? "Ver todos los leads del sistema"
                  : "Gestiona los leads de tu despacho"}
              </p>
              <button
                onClick={() => router.push("/dashboard/leads")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ver Leads
              </button>
            </div>
          )}{" "}
          {/* Card de Perfil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mi Perfil
            </h3>
            <p className="text-gray-600 mb-4">
              {user.role === "super_admin"
                ? "Actualiza la información de tu perfil de administrador"
                : "Actualiza la información de tu despacho"}
            </p>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Editar Perfil
            </button>
          </div>
          {/* Card de Estadísticas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Estadísticas
            </h3>
            <div className="space-y-2">
              {user.role === "super_admin" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total usuarios:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        systemStats?.totalUsers || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Despachos activos:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        systemStats?.activeDespachos || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads totales:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        systemStats?.totalLeads || 0
                      )}
                    </span>
                  </div>
                  {systemStats && !statsLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Por roles:</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Super Admin:</span>
                          <span className="text-purple-600 font-medium">
                            {systemStats.usersByRole.super_admin}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Despacho Admin:</span>
                          <span className="text-blue-600 font-medium">
                            {systemStats.usersByRole.despacho_admin}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Usuarios:</span>
                          <span className="text-green-600 font-medium">
                            {systemStats.usersByRole.usuario}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : user.role === "despacho_admin" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads este mes:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        despachoStats?.leadsThisMonth || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total leads:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        despachoStats?.totalLeads || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversiones:</span>
                    <span className="font-semibold">
                      {statsLoading ? (
                        <span className="inline-block w-8 h-4 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        despachoStats?.conversions || 0
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    Estadísticas disponibles cuando te asignen a un despacho
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Card de Actividad Reciente */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actividad Reciente
            </h3>
            <div className="text-center py-8 text-gray-500">
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-2">
                {user.role === "super_admin"
                  ? "Las nuevas actividades del sistema aparecerán aquí"
                  : "Los nuevos leads aparecerán aquí"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
