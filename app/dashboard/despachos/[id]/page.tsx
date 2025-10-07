"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PencilIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Despacho {
  id: string;
  nombre: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  web?: string;
  descripcion?: string;
  num_sedes?: number;
  estado?: string;
  created_at: string;
}

// Función para decodificar entidades HTML
function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function DespachoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const despachoId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [loading, setLoading] = useState(true);
  const [despacho, setDespacho] = useState<Despacho | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDespacho = async () => {
      if (!despachoId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("despachos")
          .select("*")
          .eq("id", despachoId)
          .single();

        if (error) {
          console.error("Error fetching despacho:", error);
          setError("No se pudo cargar la información del despacho");
          return;
        }

        setDespacho(data);
      } catch (err) {
        console.error("Error:", err);
        setError("Ocurrió un error al cargar el despacho");
      } finally {
        setLoading(false);
      }
    };

    fetchDespacho();
  }, [despachoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando despacho...</p>
        </div>
      </div>
    );
  }

  if (error || !despacho) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error || "No se pudo cargar el despacho"}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estadoConfig = {
    verificado: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Verificado' },
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon, label: 'Pendiente' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon, label: 'Sin estado' }
  };

  const config = estadoConfig[despacho.estado as keyof typeof estadoConfig] || estadoConfig.default;
  const EstadoIcon = config.icon;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header con navegación */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver al dashboard
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {decodeHtmlEntities(despacho.nombre)}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`${config.bg} ${config.text} text-sm font-semibold px-3 py-1 rounded-full flex items-center`}>
                  <EstadoIcon className="h-4 w-4 mr-1" />
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">
                  Creado el {new Date(despacho.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/dashboard/despachos/${despacho.id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Editar Despacho
          </button>
        </div>
      </div>

      {/* Información del despacho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de contacto */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              {despacho.localidad && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ubicación</p>
                    <p className="text-base text-gray-900">
                      {despacho.localidad}{despacho.provincia && `, ${despacho.provincia}`}
                    </p>
                  </div>
                </div>
              )}
              
              {despacho.telefono && (
                <div className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <a href={`tel:${despacho.telefono}`} className="text-base text-blue-600 hover:text-blue-700">
                      {despacho.telefono}
                    </a>
                  </div>
                </div>
              )}
              
              {despacho.email && (
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <a href={`mailto:${despacho.email}`} className="text-base text-blue-600 hover:text-blue-700">
                      {despacho.email}
                    </a>
                  </div>
                </div>
              )}
              
              {despacho.web && (
                <div className="flex items-start">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sitio Web</p>
                    <a 
                      href={despacho.web} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-base text-blue-600 hover:text-blue-700"
                    >
                      {despacho.web}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {despacho.descripcion && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-700 leading-relaxed">
                {decodeHtmlEntities(despacho.descripcion)}
              </p>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles</h2>
            <div className="space-y-3">
              {despacho.num_sedes !== undefined && despacho.num_sedes > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Número de Sedes</span>
                  <span className="text-base font-semibold text-gray-900">{despacho.num_sedes}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Estado</span>
                <span className={`${config.bg} ${config.text} text-xs font-semibold px-2 py-1 rounded`}>
                  {config.label}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-500">ID</span>
                <span className="text-xs font-mono text-gray-600">{despacho.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/despachos/${despacho.id}/edit`)}
                className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center border border-gray-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar Información
              </button>
              <button
                onClick={() => router.push("/dashboard/leads")}
                className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center border border-gray-200"
              >
                Ver Leads
              </button>
              <button
                onClick={() => router.push("/dashboard/settings?tab=mis-despachos")}
                className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center border border-gray-200"
              >
                Mis Despachos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
