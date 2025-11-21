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

export default function ApproveLeadPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [precioAprobado, setPrecioAprobado] = useState<number>(0);

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
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "procesado",
          precio_base: precioAprobado,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/admin/leads-list");
      } else {
        alert("Error al aprobar el lead");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al aprobar el lead");
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
        router.push("/dashboard/admin/leads-list");
      } else {
        alert("Error al descartar el lead");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al descartar el lead");
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Aprobar Precio de Lead
        </h1>
        <p className="text-lg text-gray-600">
          Revisa y aprueba el precio sugerido por la IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Lead */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Información del Lead
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Especialidad
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {lead.especialidad || "No especificada"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Ubicación
              </label>
              <p className="text-lg text-gray-900">
                {lead.provincia || "No especificada"}
                {lead.ciudad && `, ${lead.ciudad}`}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Urgencia
              </label>
              <p className="text-lg text-gray-900 capitalize">
                {lead.urgencia || "Media"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Calidad (IA)
              </label>
              <div className="flex items-center">
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

            <div>
              <label className="text-sm font-medium text-gray-500">
                Resumen IA
              </label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {lead.resumen_ia || "No disponible"}
              </p>
            </div>
          </div>
        </div>

        {/* Aprobación de Precio */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Aprobación de Precio
          </h2>

          {/* Precio Sugerido por IA */}
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
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

          {/* Precio a Aprobar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio a Aprobar (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioAprobado}
              onChange={(e) => setPrecioAprobado(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Diferencia */}
          {diferenciaPrecio !== 0 && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                diferenciaPrecio > 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-sm font-medium text-gray-700 mb-1">
                Diferencia con IA:
              </p>
              <p
                className={`text-xl font-bold ${
                  diferenciaPrecio > 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {diferenciaPrecio > 0 ? "+" : ""}€{diferenciaPrecio.toFixed(2)}{" "}
                ({diferenciaPrecio > 0 ? "+" : ""}
                {porcentajeDiferencia}%)
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={approving || precioAprobado <= 0}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {approving ? "Aprobando..." : "Aprobar Precio"}
            </button>

            <button
              onClick={handleReject}
              disabled={approving}
              className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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
  );
}
