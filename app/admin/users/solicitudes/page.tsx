"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import { SolicitudRegistro } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import Toast from "@/components/Toast";
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const userService = new UserService();

export default function SolicitudesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const loadSolicitudes = useCallback(async () => {
    try {
      const allSolicitudes = await userService.getAllSolicitudes();
      setSolicitudes(
        allSolicitudes.map((s) => ({
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
            ? new Date(s.fecha_solicitud as string)
            : new Date(0),
          fechaRespuesta: s.fecha_respuesta
            ? new Date(s.fecha_respuesta as string)
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
          datosDespacho: s.datosDespacho as SolicitudRegistro["datosDespacho"],
        }))
      );
    } catch (error) {
      console.error("Error loading solicitudes:", error);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadSolicitudes();
    }
  }, [user, loadSolicitudes]);

  const handleApproveSolicitud = async (solicitudId: string, notas?: string) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setToast({
          type: "error",
          message: "No hay sesión activa.",
        });
        return;
      }

      const response = await fetch("/api/aprobar-solicitud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          solicitudId,
          notas: notas || "Solicitud aprobada",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al aprobar solicitud");
      }

      await loadSolicitudes();
      setToast({
        type: "success",
        message: "Solicitud aprobada y despacho asignado correctamente.",
      });
    } catch (error) {
      console.error("Error approving solicitud:", error);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Error al aprobar la solicitud.",
      });
    }
  };

  const handleRejectSolicitud = async (solicitudId: string, notas: string) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setToast({
          type: "error",
          message: "No hay sesión activa.",
        });
        return;
      }

      const response = await fetch("/api/rechazar-solicitud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          solicitudId,
          notas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al rechazar solicitud");
      }

      await loadSolicitudes();
      setToast({ type: "info", message: "Solicitud rechazada correctamente." });
    } catch (error) {
      console.error("Error rejecting solicitud:", error);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Error al rechazar la solicitud.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  const solicitudesPendientes = solicitudes.filter((s) => s.estado === "pendiente");

  return (
    <div className="w-full">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/users")}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Gestión de Usuarios
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Solicitudes de Despacho
        </h1>
        <p className="text-lg text-gray-600">
          {solicitudesPendientes.length} solicitudes pendientes de revisión
        </p>
      </div>

      {/* Grid de solicitudes */}
      <div className="grid grid-cols-1 gap-6">
        {solicitudesPendientes.map((solicitud) => (
          <div
            key={solicitud.id}
            className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-bold text-gray-900">
                    {solicitud.user_name || "Sin nombre"}
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    <ClockIcon className="h-3 w-3" />
                    Pendiente
                  </span>
                </div>
                
                <div className="space-y-1.5 text-sm text-gray-600">
                  {solicitud.user_email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span>{solicitud.user_email}</span>
                    </div>
                  )}
                  {solicitud.telefono && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span>{solicitud.telefono}</span>
                    </div>
                  )}
                  {solicitud.empresa && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                      <span>{solicitud.empresa}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {solicitud.fechaSolicitud instanceof Date
                      ? solicitud.fechaSolicitud.toLocaleDateString("es-ES")
                      : "Fecha no disponible"}
                  </span>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleApproveSolicitud(solicitud.id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSolicitudId(solicitud.id);
                      setShowRejectModal(true);
                      setMotivoRechazo("");
                    }}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Rechazar
                  </button>                </div>
              </div>
            </div>

            {/* Información adicional */}
            {(solicitud.despacho_nombre || solicitud.datosDespacho || solicitud.mensaje) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {solicitud.despacho_nombre && (
                  <div className="flex items-start gap-2 text-sm">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">Despacho: </span>
                      <span className="text-gray-600">{solicitud.despacho_nombre}</span>
                    </div>
                  </div>
                )}
                
                {solicitud.datosDespacho && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <h5 className="font-medium text-blue-900 mb-2">
                      Datos del Despacho
                    </h5>
                    <div className="space-y-1 text-blue-800">
                      {(() => {
                        const datos = solicitud.datosDespacho as Record<string, unknown>;
                        return (
                          <>
                            <p>
                              <strong>Nombre:</strong>{" "}
                              {String(datos.nombre || "")}
                            </p>
                            {datos.especialidades && (
                              <p>
                                <strong>Especialidades:</strong>{" "}
                                {(datos.especialidades as string[])?.join(", ")}
                              </p>
                            )}
                            <p>
                              <strong>Ubicación:</strong>{" "}
                              {String(datos.ciudad || "")}, {String(datos.provincia || "")}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {solicitud.mensaje && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Mensaje:</p>
                    <p className="text-gray-600">{solicitud.mensaje}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {solicitudesPendientes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay solicitudes pendientes</p>
          <p className="text-sm text-gray-500 mt-1">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rechazar Solicitud
            </h3>
            <p className="text-gray-600 mb-4">
              Por favor, indica el motivo del rechazo. Este mensaje será enviado al usuario.
            </p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej: La documentación proporcionada no es suficiente para verificar la propiedad del despacho..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedSolicitudId(null);
                  setMotivoRechazo("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedSolicitudId && motivoRechazo.trim()) {
                    handleRejectSolicitud(selectedSolicitudId, motivoRechazo.trim());
                    setShowRejectModal(false);
                    setSelectedSolicitudId(null);
                    setMotivoRechazo("");
                  }
                }}
                disabled={!motivoRechazo.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
