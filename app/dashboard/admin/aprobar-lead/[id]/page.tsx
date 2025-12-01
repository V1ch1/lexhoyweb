"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Lead } from "@/lib/services/leadService";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function ApproveLeadPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [precioAprobado, setPrecioAprobado] = useState<number>(0);
  const [tipoPublicacion, setTipoPublicacion] = useState<"directa" | "subasta">(
    "directa"
  );
  const [duracionSubasta, setDuracionSubasta] = useState<number>(48); // horas
  const [notasInternas, setNotasInternas] = useState<string>("");

  useEffect(() => {
    if (user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
    loadLead();
  }, [user]);

  const loadLead = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setPrecioAprobado(data.precio_base || data.precio_estimado || 50);
      }
    } catch (error) {
      console.error("Error loading lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!lead) return;

    setApproving(true);
    try {
      const updateData: any = {
        estado: tipoPublicacion === "subasta" ? "en_subasta" : "procesado",
        precio_base: precioAprobado,
      };

      // Si es subasta, calcular fecha de fin
      if (tipoPublicacion === "subasta") {
        const fechaFin = new Date();
        fechaFin.setHours(fechaFin.getHours() + duracionSubasta);
        updateData.fecha_fin_subasta = fechaFin.toISOString();
      }

      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push("/dashboard/admin/listado-leads");
      } else {
        toast.error("Error al aprobar el lead");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al aprobar el lead");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!lead) return;

    if (!confirm("¿Estás seguro de descartar este lead?")) return;

    setApproving(true);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "descartado",
        }),
      });

      if (response.ok) {
        router.push("/dashboard/admin/listado-leads");
      } else {
        toast.error("Error al descartar el lead");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al descartar el lead");
    } finally {
      setApproving(false);
    }
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

  const diferenciaPrecio = precioAprobado - (lead.precio_estimado || 0);
  const porcentajeDiferencia = lead.precio_estimado
    ? ((diferenciaPrecio / lead.precio_estimado) * 100).toFixed(1)
    : 0;

  // Censurar datos personales
  const nombreCensurado = lead.nombre
    ? lead.nombre
        .split(" ")
        .map((n) => n[0] + "***")
        .join(" ")
    : "***";
  const correoCensurado = lead.correo
    ? lead.correo.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "***";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-playfair">
          Aprobar Precio de Lead
        </h1>
        <p className="text-lg text-gray-600">
          Revisa el análisis de IA y aprueba el precio para publicar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Información del Lead */}
        <div className="lg:col-span-2 space-y-6">
          {/* Análisis de IA */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">
                Análisis de IA
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Resumen Anónimo
                </label>
                <p className="text-gray-800 bg-white p-3 rounded-lg mt-1">
                  {lead.resumen_ia || "No disponible"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Especialidad
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {lead.especialidad || "No especificada"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Ubicación
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {lead.provincia || "No especificada"}
                    {lead.ciudad && `, ${lead.ciudad}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Urgencia
                  </label>
                  <p className="text-lg text-gray-900 capitalize mt-1">
                    {lead.urgencia || "Media"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Calidad (IA)
                  </label>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          (lead.puntuacion_calidad || 0) >= 70
                            ? "bg-green-500"
                            : (lead.puntuacion_calidad || 0) >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${lead.puntuacion_calidad || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {lead.puntuacion_calidad || 0}/100
                    </span>
                  </div>
                </div>
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
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {palabra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Datos Originales (Censurados) */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Datos Originales (Vista Previa Censurada)
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-500">Nombre:</label>
                <p className="text-gray-900">{nombreCensurado}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Email:</label>
                <p className="text-gray-900">{correoCensurado}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Mensaje:</label>
                <p className="text-gray-600 italic">(Oculto hasta la compra)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna lateral - Aprobación */}
        <div className="space-y-6">
          {/* Precio Sugerido por IA */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Precio Sugerido por IA
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              €{lead.precio_estimado?.toFixed(2) || "0.00"}
            </p>
          </div>

          {/* Formulario de Aprobación */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configuración de Publicación
            </h2>

            {/* Precio a Aprobar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Base (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioAprobado}
                onChange={(e) =>
                  setPrecioAprobado(parseFloat(e.target.value) || 0)
                }
                className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Diferencia */}
            {diferenciaPrecio !== 0 && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  diferenciaPrecio > 0
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Diferencia con IA:
                </p>
                <p
                  className={`text-lg font-bold ${
                    diferenciaPrecio > 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {diferenciaPrecio > 0 ? "+" : ""}€
                  {diferenciaPrecio.toFixed(2)} (
                  {diferenciaPrecio > 0 ? "+" : ""}
                  {porcentajeDiferencia}%)
                </p>
              </div>
            )}

            {/* Tipo de Publicación */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Publicación
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tipoPublicacion"
                    value="directa"
                    checked={tipoPublicacion === "directa"}
                    onChange={(e) =>
                      setTipoPublicacion(e.target.value as "directa")
                    }
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Compra Directa
                  </span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tipoPublicacion"
                    value="subasta"
                    checked={tipoPublicacion === "subasta"}
                    onChange={(e) =>
                      setTipoPublicacion(e.target.value as "subasta")
                    }
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Subasta
                  </span>
                </label>
              </div>
            </div>

            {/* Configuración de Subasta */}
            {tipoPublicacion === "subasta" && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración de Subasta (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={duracionSubasta}
                  onChange={(e) =>
                    setDuracionSubasta(parseInt(e.target.value) || 48)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  La subasta finalizará en {duracionSubasta} horas
                </p>
              </div>
            )}

            {/* Notas Internas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas (Opcional)
              </label>
              <textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Añade notas para otros administradores..."
              />
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3">
              <button
                onClick={handleApprove}
                disabled={approving || precioAprobado <= 0}
                className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {approving ? "Aprobando..." : "Aprobar y Publicar"}
              </button>

              <button
                onClick={handleReject}
                disabled={approving}
                className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Descartar Lead
              </button>

              <button
                onClick={() => router.back()}
                disabled={approving}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
