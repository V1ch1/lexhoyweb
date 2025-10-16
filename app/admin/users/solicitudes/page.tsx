"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import RechazarSolicitudModal from "@/components/RechazarSolicitudModal";
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
  
  // Estado para rastrear las solicitudes que se están procesando
  const [processingSolicitudes, setProcessingSolicitudes] = useState<{[key: string]: 'approving' | 'rejecting' | null}>({});
  
  // Estado para controlar el modal de rechazo
  const [rechazoModal, setRechazoModal] = useState<{
    isOpen: boolean;
    solicitudId: string | null;
    notas: string;
  }>({
    isOpen: false,
    solicitudId: null,
    notas: ''
  });

  const loadSolicitudes = useCallback(async () => {
    try {
      const allSolicitudes = await userService.getAllSolicitudes();
      const filteredSolicitudes = allSolicitudes
        .filter(s => s.estado === 'pendiente')
        .map((s) => ({
          id: s.id as string,
          user_id: s.user_id as string | undefined,
          user_email: s.user_email as string | undefined,
          user_name: s.user_name as string | undefined,
          despacho_id: s.despacho_id as string | undefined,
          despacho_nombre: s.despacho_nombre as string | undefined,
          despacho_localidad: s.despacho_localidad as string | undefined,
          despacho_provincia: s.despacho_provincia as string | undefined,
          estado: 'pendiente' as const,
          fechaSolicitud: s.fecha_solicitud
            ? new Date(s.fecha_solicitud as string)
            : new Date(0),
          fechaRespuesta: s.fecha_respuesta
            ? new Date(s.fecha_respuesta as string)
            : undefined,
          respondidoPor: s.respondido_por as string | undefined,
          notasRespuesta: s.notas_respuesta as string | undefined,
          userCreadoId: s.user_creado_id as string | undefined,
          despachoCreadoId: s.despacho_creado_id as string | undefined,
          email: s.email as string | undefined,
          nombre: s.nombre as string | undefined,
          apellidos: s.apellidos as string | undefined,
          telefono: s.telefono as string | undefined,
          empresa: s.empresa as string | undefined,
          mensaje: s.mensaje as string | undefined,
          datosDespacho: s.datos_despacho as SolicitudRegistro["datosDespacho"],
        }));
      
      setSolicitudes(filteredSolicitudes);
    } catch (error) {
      console.error("Error loading solicitudes:", error);
      setToast({
        type: "error",
        message: "Error al cargar las solicitudes. Por favor, recarga la página."
      });
    }
  }, []);

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadSolicitudes();
    }
  }, [user, loadSolicitudes]);

  const handleApproveSolicitud = async (solicitudId: string, notas?: string) => {
    try {
      // Marcar esta solicitud como en proceso de aprobación
      setProcessingSolicitudes(prev => ({
        ...prev,
        [solicitudId]: 'approving'
      }));
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
    } finally {
      // Quitar el estado de procesamiento independientemente del resultado
      setProcessingSolicitudes(prev => ({
        ...prev,
        [solicitudId]: null
      }));
    }
  };

  const handleOpenRechazoModal = (solicitudId: string) => {
    setRechazoModal({
      isOpen: true,
      solicitudId,
      notas: ''
    });
  };

  const handleCloseRechazoModal = () => {
    setRechazoModal({
      isOpen: false,
      solicitudId: null,
      notas: ''
    });
  };

  const handleRejectSolicitud = async (solicitudId: string, notas: string = '') => {
    try {
      // Marcar esta solicitud como en proceso de rechazo
      setProcessingSolicitudes(prev => ({
        ...prev,
        [solicitudId]: 'rejecting'
      }));
      
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

      // Actualizar el estado local para eliminar la solicitud rechazada
      setSolicitudes(prevSolicitudes => 
        prevSolicitudes.filter(s => s.id !== solicitudId)
      );
      
      setToast({ 
        type: "success", 
        message: "Solicitud rechazada correctamente." 
      });
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Error al rechazar la solicitud.",
      });
    } finally {
      // Quitar el estado de procesamiento
      setProcessingSolicitudes(prev => ({
        ...prev,
        [solicitudId]: null
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          {solicitudes.length} solicitudes pendientes de revisión
        </p>
      </div>

      {/* Grid de solicitudes */}
      <div className="grid grid-cols-1 gap-6">
        {solicitudes.map((solicitud) => (
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
                    disabled={!!processingSolicitudes[solicitud.id]}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                      processingSolicitudes[solicitud.id] === 'approving'
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    {processingSolicitudes[solicitud.id] === 'approving' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Aprobar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenRechazoModal(solicitud.id)}
                    disabled={!!processingSolicitudes[solicitud.id]}
                    className={`inline-flex items-center px-3 py-1.5 border ${
                      processingSolicitudes[solicitud.id] === 'rejecting'
                        ? 'border-red-300 bg-red-50 cursor-not-allowed'
                        : 'border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    } shadow-sm text-xs font-medium rounded-md text-gray-700`}
                  >
                    {processingSolicitudes[solicitud.id] === 'rejecting' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                        Rechazar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Información adicional */}
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
          </div>
        ))}
      </div>

      <RechazarSolicitudModal
        isOpen={rechazoModal.isOpen}
        onClose={handleCloseRechazoModal}
        onConfirm={(notas) => {
          if (rechazoModal.solicitudId) {
            handleRejectSolicitud(rechazoModal.solicitudId, notas);
          }
          handleCloseRechazoModal();
        }}
        isLoading={rechazoModal.solicitudId ? !!processingSolicitudes[rechazoModal.solicitudId] : false}
      />

      {solicitudes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay solicitudes pendientes</p>
          <p className="text-sm text-gray-500 mt-1">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      )}
    </div>
  );
}
