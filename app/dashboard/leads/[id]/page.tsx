"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { capitalize } from "@/lib/utils";



interface LeadDetail {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  cuerpo_mensaje: string;
  resumen_ia: string;
  especialidad: string;
  provincia: string;
  ciudad: string;
  urgencia: string;
  precio_base: number;
  puntuacion_calidad: number;
  nivel_detalle: string;
  estado: string;
  comprador_id?: string;
  created_at: string;
  url_pagina: string;
  titulo_post: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchLead(params.id as string);
    }
  }, [params.id]);

  const fetchLead = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();

      if (data.success) {
        setLead(data.data);
      } else {
        setError(data.error || "Error cargando lead");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!lead) return;

    try {
      setBuying(true);
      
      // Crear sesión de checkout de Stripe
      const res = await fetch(`/api/leads/${lead.id}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();

      if (data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Error al iniciar el pago");
        setBuying(false);
      }
    } catch (err) {
      toast.error("Error de conexión");
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded-xl mb-6"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-red-600 mb-4">{error || "Lead no encontrado"}</p>
        <Link
          href="/dashboard/leads"
          className="text-[#E04040] hover:underline"
        >
          &larr; Volver al marketplace
        </Link>
      </div>
    );
  }

  const isPurchased = lead.estado === "vendido" && lead.comprador_id;

  return (
    <div className="p-6 w-full">
      <Link
        href="/dashboard/leads"
        className="text-gray-500 hover:text-gray-900 text-sm mb-6 inline-block"
      >
        &larr; Volver al marketplace
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {capitalize(lead.especialidad) || "General"}
                </span>
                {lead.provincia && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.provincia}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 uppercase">
                  {lead.urgencia}
                </span>
                {isAuction && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 uppercase">
                    Subasta Activa
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Consulta Legal #{lead.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Recibido{" "}
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">
                {isAuction ? "Precio Actual" : "Precio"}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {lead.precio_actual || lead.precio_base}€
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isPurchased ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                ✅ Lead Comprado - Datos de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">
                    Nombre
                  </label>
                  <p className="font-medium text-gray-900">{lead.nombre}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">
                    Email
                  </label>
                  <p className="font-medium text-gray-900">{lead.correo}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">
                    Teléfono
                  </label>
                  <p className="font-medium text-gray-900">
                    {lead.telefono || "No proporcionado"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">
                    Origen
                  </label>
                  <a
                    href={lead.url_pagina}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E04040] hover:underline truncate block"
                  >
                    {lead.titulo_post}
                  </a>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Mensaje Completo
                </label>
                <p className="text-gray-800 whitespace-pre-wrap bg-white p-4 rounded border border-green-100">
                  {lead.cuerpo_mensaje}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Resumen del Caso (IA)
              </h3>
              <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                {lead.resumen_ia}
              </p>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                    Calidad
                    <span 
                      className="inline-block cursor-help" 
                      title="Puntuación basada en: completitud de información, urgencia del caso y potencial económico. Mayor puntuación = lead más valioso."
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg">
                    {lead.puntuacion_calidad}/100
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500 uppercase">Detalle</div>
                  <div className="font-bold text-gray-900 capitalize">
                    {lead.nivel_detalle || "Medio"}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500 uppercase">Ubicación</div>
                  <div className="font-bold text-gray-900">
                    {lead.ciudad ? `${lead.ciudad}${lead.provincia ? `, ${lead.provincia}` : ''}` : (lead.provincia || "-")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPurchased && (
            <div className="flex justify-end pt-6 border-t border-gray-100">
              {isAuction ? (
                <div className="w-full max-w-md">
                  <BidForm
                    leadId={lead.id}
                    currentPrice={lead.precio_actual || lead.precio_base}
                    minBid={(lead.precio_actual || lead.precio_base) + 5}
                    endDate={lead.fecha_fin_subasta || new Date().toISOString()}
                  />
                </div>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="bg-[#E04040] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#c83838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {buying ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                    `Comprar Lead por ${lead.precio_base}€`
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
