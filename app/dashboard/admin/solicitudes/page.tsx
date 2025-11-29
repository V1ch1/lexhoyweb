"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Toast from "@/components/Toast";

// Types
interface Solicitud {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  despacho_id: string;
  despacho_nombre: string;
  despacho_localidad: string | null;
  despacho_provincia: string | null;
  estado: "pendiente" | "aprobado" | "rechazado" | "cancelada";
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_respuesta?: string;
}

type EstadoFilter = "todas" | "pendiente" | "aprobado" | "rechazado" | "cancelada";

interface ModalData {
  isOpen: boolean;
  type: "aprobar" | "rechazar" | "revocar" | "modificar" | null;
  solicitudId: string | null;
  solicitudNombre: string | null;
}

interface ConfirmModalData {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ToastData {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function AdminSolicitudesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalData>({
    isOpen: false,
    type: null,
    solicitudId: null,
    solicitudNombre: null,
  });
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [motivo, setMotivo] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Verificar autenticación y rol
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Cargar solicitudes
  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchSolicitudes();
    }
  }, [user?.role]);

  // Filtrar solicitudes
  useEffect(() => {
    let filtered = solicitudes;

    // Filtrar por estado
    if (estadoFilter !== "todas") {
      filtered = filtered.filter((s) => s.estado === estadoFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.user_name.toLowerCase().includes(term) ||
          s.user_email.toLowerCase().includes(term) ||
          s.despacho_nombre.toLowerCase().includes(term)
      );
    }

    setFilteredSolicitudes(filtered);
  }, [solicitudes, estadoFilter, searchTerm]);

  // Toast helpers
  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/solicitudes");
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      showToast("Error al cargar solicitudes", "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (
    type: "aprobar" | "rechazar" | "revocar" | "modificar",
    solicitudId: string,
    solicitudNombre: string
  ) => {
    setModal({
      isOpen: true,
      type,
      solicitudId,
      solicitudNombre,
    });
    setMotivo("");
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: null,
      solicitudId: null,
      solicitudNombre: null,
    });
    setMotivo("");
  };

  const handleEstadoChange = async (solicitudId: string, nuevoEstado: string, nombreDespacho: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar cambio de estado",
      message: `¿Estás seguro de que quieres cambiar el estado de la solicitud para "${nombreDespacho}" a "${nuevoEstado}"?`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          const response = await fetch(`/api/admin/solicitudes/${solicitudId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accion: "modificar",
              nuevoEstado: nuevoEstado,
            }),
          });

          if (response.ok) {
            await fetchSolicitudes();
            showToast(`Estado cambiado a "${nuevoEstado}" correctamente`, "success");
          } else {
            const error = await response.json();
            showToast(error.error || "Error al cambiar el estado", "error");
          }
        } catch (error) {
          console.error("Error cambiando estado:", error);
          showToast("Error al cambiar el estado de la solicitud", "error");
        }
      },
    });
  };

  const handleAction = async () => {
    if (!modal.solicitudId || !modal.type) return;

    setProcessing(true);
    try {
      const body: { accion: string; motivo?: string; nuevoEstado?: string } = {
        accion: modal.type,
      };

      if (motivo.trim()) {
        body.motivo = motivo;
      }

      const response = await fetch(
        `/api/admin/solicitudes/${modal.solicitudId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        await fetchSolicitudes();
        closeModal();
        const actionText = modal.type === "aprobar" ? "aprobada" : modal.type === "rechazar" ? "rechazada" : "revocada";
        showToast(`Solicitud ${actionText} correctamente`, "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Error al procesar la solicitud", "error");
      }
    } catch (error) {
      console.error("Error procesando solicitud:", error);
      showToast("Error al procesar la solicitud", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pendiente
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Aprobado
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Rechazado
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Gestión de Solicitudes
        </h1>
        <p className="text-lg text-gray-600">
          Administra todas las solicitudes de despacho del sistema
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario o despacho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estado Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="todas">Todas las solicitudes</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span>
            Total: <strong>{filteredSolicitudes.length}</strong>
          </span>
          <span>
            Pendientes:{" "}
            <strong className="text-yellow-600">
              {solicitudes.filter((s) => s.estado === "pendiente").length}
            </strong>
          </span>
          <span>
            Aprobadas:{" "}
            <strong className="text-green-600">
              {solicitudes.filter((s) => s.estado === "aprobado").length}
            </strong>
          </span>
          <span>
            Rechazadas:{" "}
            <strong className="text-red-600">
              {solicitudes.filter((s) => s.estado === "rechazado").length}
            </strong>
          </span>
          <span>
            Canceladas:{" "}
            <strong className="text-gray-600">
              {solicitudes.filter((s) => s.estado === "cancelada").length}
            </strong>
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSolicitudes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">
            No hay solicitudes
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm || estadoFilter !== "todas"
              ? "Intenta ajustar los filtros"
              : "No se encontraron solicitudes en el sistema"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despacho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSolicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {solicitud.user_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {solicitud.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {solicitud.despacho_nombre}
                        </div>
                        {(solicitud.despacho_localidad ||
                          solicitud.despacho_provincia) && (
                          <div className="text-sm text-gray-500">
                            {[
                              solicitud.despacho_localidad,
                              solicitud.despacho_provincia,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(solicitud.estado)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(solicitud.fecha_solicitud).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={solicitud.estado}
                        onChange={(e) =>
                          handleEstadoChange(
                            solicitud.id,
                            e.target.value,
                            solicitud.despacho_nombre
                          )
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modal.type === "aprobar" && "Aprobar Solicitud"}
              {modal.type === "rechazar" && "Rechazar Solicitud"}
              {modal.type === "revocar" && "Revocar Solicitud"}
              {modal.type === "modificar" && "Modificar Solicitud"}
            </h3>
            <p className="text-gray-600 mb-4">
              {modal.type === "aprobar" &&
                `¿Estás seguro de que quieres aprobar la solicitud para "${modal.solicitudNombre}"?`}
              {modal.type === "rechazar" &&
                `¿Estás seguro de que quieres rechazar la solicitud para "${modal.solicitudNombre}"?`}
              {modal.type === "revocar" &&
                `¿Estás seguro de que quieres revocar el acceso al despacho "${modal.solicitudNombre}"? Esto eliminará al usuario como propietario.`}
            </p>

            {(modal.type === "rechazar" || modal.type === "revocar") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo {modal.type === "rechazar" ? "(opcional)" : "(recomendado)"}
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explica el motivo..."
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modal.type === "aprobar"
                    ? "bg-green-600 hover:bg-green-700"
                    : modal.type === "rechazar"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {processing ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {confirmModal.title}
            </h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
