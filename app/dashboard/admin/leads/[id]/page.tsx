"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Lead } from "@/lib/services/leadService";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import ConfirmModal from "@/components/admin/ConfirmModal";
import LeadHistoryTimeline from "@/components/admin/LeadHistoryTimeline";
import LeadViewStats from "@/components/admin/LeadViewStats";

export default function AdminLeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    resumen_ia: "",
    especialidad: "",
    provincia: "",
    ciudad: "",
    urgencia: "media" as "baja" | "media" | "alta" | "urgente",
    precio_base: 0,
    estado: "pendiente" as "pendiente" | "procesado" | "vendido" | "descartado",
    palabras_clave: [] as string[],
  });

  useEffect(() => {
    if (!params.id) return;

    if (user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    loadLead();
    trackView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const trackView = async () => {
    try {
      // Registrar visualización de forma asíncrona sin bloquear la UI
      await fetch(`/api/admin/leads/${params.id}/track-view`, {
        method: "POST",
      });
    } catch (error) {
      // Silenciar errores de tracking para no afectar la experiencia del usuario
      console.error("Error tracking view:", error);
    }
  };

  const loadLead = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setFormData({
          resumen_ia: data.resumen_ia || "",
          especialidad: data.especialidad || "",
          provincia: data.provincia || "",
          ciudad: data.ciudad || "",
          urgencia: data.urgencia || "media",
          precio_base: data.precio_base || data.precio_estimado || 0,
          estado: data.estado || "pendiente",
          palabras_clave: data.palabras_clave || [],
        });
      }
    } catch (error) {
      console.error("Error loading lead:", error);
      toast.error("Error al cargar el lead");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          precio_base: Number(formData.precio_base),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLead(updated);
        setEditing(false);
        toast.success("Lead actualizado correctamente");
      } else {
        toast.error("Error al actualizar el lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Error al actualizar el lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Lead eliminado correctamente");
        router.push("/dashboard/admin/listado-leads");
      } else {
        toast.error("Error al eliminar el lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Error al eliminar el lead");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancel = () => {
    if (!lead) return;
    setFormData({
      resumen_ia: lead.resumen_ia || "",
      especialidad: lead.especialidad || "",
      provincia: lead.provincia || "",
      ciudad: lead.ciudad || "",
      urgencia: lead.urgencia || "media",
      precio_base: lead.precio_base || lead.precio_estimado || 0,
      estado: lead.estado || "pendiente",
      palabras_clave: lead.palabras_clave || [],
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-red-600">Lead no encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalle del Lead
          </h1>
          <p className="text-sm text-gray-500 mt-1">ID: {lead.id}</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={saving}
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumen IA */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen de IA
            </h2>
            {editing ? (
              <textarea
                value={formData.resumen_ia}
                onChange={(e) =>
                  setFormData({ ...formData, resumen_ia: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700">{lead.resumen_ia || "Sin resumen"}</p>
            )}
          </div>

          {/* Información del lead */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Lead
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) =>
                      setFormData({ ...formData, especialidad: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.especialidad || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgencia
                </label>
                {editing ? (
                  <select
                    value={formData.urgencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urgencia: e.target.value as "baja" | "media" | "alta",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{lead.urgencia || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) =>
                      setFormData({ ...formData, provincia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.provincia || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{lead.ciudad || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Datos originales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Datos Originales
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Nombre:</span>
                <p className="text-gray-900">{lead.nombre || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{lead.correo || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Teléfono:</span>
                <p className="text-gray-900">{lead.telefono || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Mensaje:</span>
                <p className="text-gray-600 bg-gray-50 p-3 rounded border mt-1">
                  {lead.cuerpo_mensaje || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Estado y Precio */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estado y Precio
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                {editing ? (
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="procesado">Procesado</option>
                    <option value="vendido">Vendido</option>
                    <option value="descartado">Descartado</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      lead.estado === "vendido"
                        ? "bg-green-100 text-green-800"
                        : lead.estado === "procesado"
                        ? "bg-blue-100 text-blue-800"
                        : lead.estado === "descartado"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {lead.estado}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Base (€)
                </label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_base}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_base: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(lead.precio_base || lead.precio_estimado || 0)}
                  </p>
                )}
                {lead.precio_estimado && (
                  <p className="text-xs text-gray-500 mt-1">
                    Precio estimado IA: {formatCurrency(lead.precio_estimado)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Calidad */}
          {lead.puntuacion_calidad && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Calidad
              </h2>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                  <div
                    className={`h-3 rounded-full ${
                      lead.puntuacion_calidad >= 70
                        ? "bg-green-500"
                        : lead.puntuacion_calidad >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${lead.puntuacion_calidad}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {lead.puntuacion_calidad}
                </span>
              </div>
            </div>
          )}

          {/* Palabras clave */}
          {lead.palabras_clave && lead.palabras_clave.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Palabras Clave
              </h2>
              <div className="flex flex-wrap gap-2">
                {lead.palabras_clave.map((palabra, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {palabra}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Sistema
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Creado:</span>
                <p className="text-gray-900">
                  {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>
              {lead.updated_at && (
                <div>
                  <span className="font-medium text-gray-500">Última actualización:</span>
                  <p className="text-gray-900">
                    {new Date(lead.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
              {lead.comprador_id && (
                <div>
                  <span className="font-medium text-gray-500">Comprador:</span>
                  <p className="text-gray-900">{lead.comprador_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Visualización - Ancho Completo */}
      <div className="mt-6">
        <LeadViewStats leadId={lead.id} />
      </div>

      {/* Historial de Cambios - Ancho Completo */}
      <div className="mt-6">
        <LeadHistoryTimeline leadId={lead.id} />
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Lead"
        message="¿Estás seguro de que quieres eliminar este lead? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}
