"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PencilIcon,
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

interface DespachoForm {
  nombre: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  web: string;
  descripcion: string;
  num_sedes: number;
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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<DespachoForm>({
    nombre: '',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
    web: '',
    descripcion: '',
    num_sedes: 1,
  });

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
        
        // Inicializar formData con los datos del despacho
        setFormData({
          nombre: decodeHtmlEntities(data.nombre || ''),
          localidad: data.localidad || '',
          provincia: data.provincia || '',
          telefono: data.telefono || '',
          email: data.email || '',
          web: data.web || '',
          descripcion: decodeHtmlEntities(data.descripcion || ''),
          num_sedes: data.num_sedes || 1,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Ocurrió un error al cargar el despacho");
      } finally {
        setLoading(false);
      }
    };

    fetchDespacho();
  }, [despachoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_sedes' ? parseInt(value) || 1 : value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSuccess(false);
    setError(null);
    // Restaurar datos originales
    if (despacho) {
      setFormData({
        nombre: decodeHtmlEntities(despacho.nombre || ''),
        localidad: despacho.localidad || '',
        provincia: despacho.provincia || '',
        telefono: despacho.telefono || '',
        email: despacho.email || '',
        web: despacho.web || '',
        descripcion: decodeHtmlEntities(despacho.descripcion || ''),
        num_sedes: despacho.num_sedes || 1,
      });
    }
  };

  const handleSave = async () => {
    if (!despachoId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('despachos')
        .update({
          nombre: formData.nombre,
          localidad: formData.localidad,
          provincia: formData.provincia,
          telefono: formData.telefono,
          email: formData.email,
          web: formData.web,
          descripcion: formData.descripcion,
          num_sedes: formData.num_sedes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', despachoId);

      if (updateError) {
        throw updateError;
      }

      // Actualizar el estado local con los nuevos datos
      setDespacho(prev => prev ? { ...prev, ...formData } : null);
      setSuccess(true);
      setIsEditing(false);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error al actualizar:', err);
      setError('No se pudo actualizar el despacho. Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

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

  if (error && !despacho) {
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

  const config = estadoConfig[despacho!.estado as keyof typeof estadoConfig] || estadoConfig.default;
  const EstadoIcon = config.icon;

  return (
    <div className="p-6 w-full">
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
                {isEditing ? 'Editar Despacho' : decodeHtmlEntities(formData.nombre)}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`${config.bg} ${config.text} text-sm font-semibold px-3 py-1 rounded-full flex items-center`}>
                  <EstadoIcon className="h-4 w-4 mr-1" />
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">
                  Creado el {new Date(despacho!.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5 inline mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Guardar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">¡Despacho actualizado correctamente!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Contenido del despacho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Despacho {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-base text-gray-900">{formData.nombre}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localidad</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="localidad"
                      value={formData.localidad}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{formData.localidad || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{formData.provincia || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Sedes</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="num_sedes"
                    value={formData.num_sedes}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-base text-gray-900">{formData.num_sedes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-base text-gray-900">
                    {formData.telefono ? (
                      <a href={`tel:${formData.telefono}`} className="text-blue-600 hover:text-blue-700">
                        {formData.telefono}
                      </a>
                    ) : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-base text-gray-900">
                    {formData.email ? (
                      <a href={`mailto:${formData.email}`} className="text-blue-600 hover:text-blue-700">
                        {formData.email}
                      </a>
                    ) : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="web"
                    value={formData.web}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-base text-gray-900">
                    {formData.web ? (
                      <a href={formData.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        {formData.web}
                      </a>
                    ) : '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
            <div>
              {isEditing ? (
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe tu despacho, especialidades, experiencia, etc."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formData.descripcion || 'Sin descripción'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Estado</span>
                <span className={`${config.bg} ${config.text} text-xs font-semibold px-2 py-1 rounded`}>
                  {config.label}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-500">ID</span>
                <span className="text-xs font-mono text-gray-600">{despacho!.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          {!isEditing && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-2">
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
          )}
        </div>
      </div>
    </div>
  );
}
