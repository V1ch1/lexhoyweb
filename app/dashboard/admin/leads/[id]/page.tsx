"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Lead } from "@/lib/services/leadService";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminLeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    
    if (user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
    
    loadLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]); // Solo cargar cuando cambia el ID

  const loadLead = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setNewPrice(data.precio_base || data.precio_estimado || 0);
      }
    } catch (error) {
      console.error("Error loading lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!lead) return;

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: lead.estado,
          precio_base: newPrice,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLead(updated);
        setEditingPrice(false);
      }
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Error al actualizar el precio");
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!lead) return;
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: newStatus,
          precio_base: lead.precio_base,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLead(updated);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    
    if (lead.estado === "vendido" && lead.comprador_id) {
      toast.error("No se puede eliminar un lead que ya ha sido vendido");
      return;
    }

    if (!confirm("¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.")) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/leads/${lead.id}/eliminar`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Lead eliminado exitosamente");
        router.push("/dashboard/admin/listado-leads");
      } else {
        toast.error(data.error || "Error al eliminar el lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Error al eliminar el lead");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-playfair">
              Detalle del Lead
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: {lead.id.substring(0, 16)}...
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleChangeStatus("procesado")}
              disabled={lead.estado === "procesado"}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Marcar Procesado
            </button>
            <button
              onClick={() => handleChangeStatus("descartado")}
              disabled={lead.estado === "descartado"}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
            >
              Descartar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (lead.estado === "vendido" && !!lead.comprador_id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              title={lead.estado === "vendido" ? "No se puede eliminar un lead vendido" : "Eliminar lead"}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Datos del Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nombre
                </label>
                <p className="text-lg text-gray-900">{lead.nombre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-lg text-gray-900">{lead.correo}</p>
              </div>
              {lead.telefono && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Teléfono
                  </label>
                  <p className="text-lg text-gray-900">{lead.telefono}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje Original */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Mensaje Original
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {lead.cuerpo_mensaje}
            </p>
          </div>

          {/* Análisis de IA */}
          {lead.resumen_ia && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                Análisis de IA
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Resumen Anónimo
                  </label>
                  <p className="text-gray-800 mt-1">{lead.resumen_ia}</p>
                </div>
                {lead.palabras_clave && lead.palabras_clave.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Palabras Clave
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lead.palabras_clave.map((palabra, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {palabra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Estado y Clasificación */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Clasificación
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Estado
                </label>
                <p>
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      lead.estado === "vendido"
                        ? "bg-green-100 text-green-800"
                        : lead.estado === "procesado"
                        ? "bg-blue-100 text-blue-800"
                        : lead.estado === "en_subasta"
                        ? "bg-purple-100 text-purple-800"
                        : lead.estado === "descartado"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {lead.estado}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Especialidad
                </label>
                <p className="text-gray-900">
                  {lead.especialidad || "No especificada"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ubicación
                </label>
                <p className="text-gray-900">
                  {lead.provincia || "No especificada"}
                  {lead.ciudad && `, ${lead.ciudad}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Urgencia
                </label>
                <p className="text-gray-900 capitalize">
                  {lead.urgencia || "Media"}
                </p>
              </div>
              {lead.puntuacion_calidad && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Calidad (IA)
                  </label>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          lead.puntuacion_calidad >= 70
                            ? "bg-green-500"
                            : lead.puntuacion_calidad >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${lead.puntuacion_calidad}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {lead.puntuacion_calidad}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-3">
              {lead.precio_estimado && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Precio Estimado (IA)
                  </label>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(lead.precio_estimado)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Precio Base
                </label>
                {editingPrice ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPrice}
                      onChange={(e) =>
                        setNewPrice(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdatePrice}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrice(false);
                          setNewPrice(
                            lead.precio_base || lead.precio_estimado || 0
                          );
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {lead.precio_base
                        ? formatCurrency(lead.precio_base)
                        : "-"}
                    </p>
                    <button
                      onClick={() => setEditingPrice(true)}
                      className="text-primary hover:text-primary/80"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              {lead.precio_venta && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Precio de Venta
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(lead.precio_venta)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadatos */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Metadatos</h2>
            <div className="space-y-2 text-sm">
              <div>
                <label className="font-medium text-gray-500">Fuente:</label>
                <p className="text-gray-900">{lead.fuente || "lexhoy.com"}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">
                  Fecha creación:
                </label>
                <p className="text-gray-900">
                  {new Date(lead.created_at).toLocaleString("es-ES")}
                </p>
              </div>
              {lead.procesado_at && (
                <div>
                  <label className="font-medium text-gray-500">
                    Procesado:
                  </label>
                  <p className="text-gray-900">
                    {new Date(lead.procesado_at).toLocaleString("es-ES")}
                  </p>
                </div>
              )}
              {lead.aprobado_por && (
                <div>
                  <label className="font-medium text-gray-500">
                    Aprobado por:
                  </label>
                  <p className="text-gray-900">{lead.aprobado_por}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
