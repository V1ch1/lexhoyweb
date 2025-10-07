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
  XMarkIcon,
  ExclamationCircleIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";

interface Sede {
  id?: number;
  despacho_id?: string;
  nombre?: string;
  descripcion?: string;
  web?: string;
  persona_contacto?: string;
  ano_fundacion?: string;
  tamano_despacho?: string;
  telefono?: string;
  email?: string;
  email_contacto?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigo_postal?: string;
  localidad?: string;
  provincia?: string;
  pais?: string;
  especialidades?: string;
  servicios_especificos?: string;
  areas_practica?: string[];
  horarios?: Record<string, string>;
  redes_sociales?: Record<string, string>;
  estado_verificacion?: string;
  estado_registro?: string;
  observaciones?: string;
  foto_perfil?: string;
  es_principal?: boolean;
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Despacho {
  id: string;
  object_id?: string;
  nombre: string;
  descripcion?: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  email_contacto?: string;
  web?: string;
  num_sedes?: number;
  areas_practica?: string[];
  sedes?: Sede[];
  estado?: string;
  verificado?: boolean;
  activo?: boolean;
  slug?: string;
  created_at: string;
  updated_at?: string;
}

interface DespachoForm {
  nombre: string;
  descripcion: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  email_contacto: string;
  web: string;
  num_sedes: number;
  areas_practica: string[];
}

// Áreas de práctica disponibles
const AREAS_PRACTICA = [
  "Administrativo",
  "Bancario",
  "Civil",
  "Comercial",
  "Concursal",
  "Consumo",
  "Empresarial",
  "Familia",
  "Fiscal",
  "Inmobiliario",
  "Laboral",
  "Medio Ambiente",
  "Mercantil",
  "Penal",
  "Propiedad Intelectual",
  "Protección de Datos",
  "Salud",
  "Seguros",
  "Sucesiones",
  "Tráfico",
  "Urbanismo",
  "Vivienda",
];

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
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSedeTab, setActiveSedeTab] = useState(0);
  const [formData, setFormData] = useState<DespachoForm>({
    nombre: '',
    descripcion: '',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
    email_contacto: '',
    web: '',
    num_sedes: 1,
    areas_practica: [],
  });

  useEffect(() => {
    const fetchDespacho = async () => {
      if (!despachoId) return;
      
      try {
        setLoading(true);
        
        // Cargar despacho
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

        console.log("📊 Datos del despacho cargados:", data);
        console.log("📊 Campos disponibles:", Object.keys(data));

        setDespacho(data);
        
        // Cargar sedes del despacho
        const { data: sedesData, error: sedesError } = await supabase
          .from("sedes")
          .select("*")
          .eq("despacho_id", despachoId)
          .order("es_principal", { ascending: false });

        if (sedesError) {
          console.error("Error fetching sedes:", sedesError);
        } else {
          console.log("📍 Sedes cargadas:", sedesData?.length || 0);
          setSedes(sedesData || []);
        }
        
        // Inicializar formData con los datos del despacho
        setFormData({
          nombre: decodeHtmlEntities(data.nombre || ''),
          descripcion: decodeHtmlEntities(data.descripcion || ''),
          localidad: data.localidad || data.direccion || '',
          provincia: data.provincia || '',
          telefono: data.telefono || '',
          email: data.email || '',
          email_contacto: data.email_contacto || '',
          web: data.web || '',
          num_sedes: data.num_sedes || 1,
          areas_practica: data.areas_practica || [],
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
      const despachoData = despacho as Despacho & { direccion?: string };
      setFormData({
        nombre: decodeHtmlEntities(despachoData.nombre || ''),
        descripcion: decodeHtmlEntities(despachoData.descripcion || ''),
        localidad: despachoData.localidad || despachoData.direccion || '',
        provincia: despachoData.provincia || '',
        telefono: despachoData.telefono || '',
        email: despachoData.email || '',
        email_contacto: despachoData.email_contacto || '',
        web: despachoData.web || '',
        num_sedes: despachoData.num_sedes || 1,
        areas_practica: despachoData.areas_practica || [],
      });
    }
  };

  const handleSave = async () => {
    if (!despachoId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // 1. Obtener el object_id de WordPress desde Supabase
      const { data: despachoData, error: fetchError } = await supabase
        .from('despachos')
        .select('object_id')
        .eq('id', despachoId)
        .single();

      if (fetchError) {
        console.error('Error al obtener object_id:', fetchError);
      }

      const wpObjectId = despachoData?.object_id;

      // 2. Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('despachos')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          localidad: formData.localidad,
          provincia: formData.provincia,
          telefono: formData.telefono,
          email: formData.email,
          email_contacto: formData.email_contacto,
          web: formData.web,
          num_sedes: formData.num_sedes,
          areas_practica: formData.areas_practica,
          updated_at: new Date().toISOString(),
        })
        .eq('id', despachoId);

      if (updateError) {
        throw updateError;
      }

      // 3. Actualizar en WordPress si existe object_id
      if (wpObjectId) {
        try {
          const wpUser = process.env.NEXT_PUBLIC_WP_USER || '';
          const wpAppPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD || '';
          const auth = btoa(`${wpUser}:${wpAppPassword}`);

          const wpResponse = await fetch(`https://lexhoy.com/wp-json/wp/v2/despacho/${wpObjectId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: formData.nombre,
              content: formData.descripcion,
              acf: {
                localidad: formData.localidad,
                provincia: formData.provincia,
                telefono: formData.telefono,
                email: formData.email,
                email_contacto: formData.email_contacto,
                web: formData.web,
                descripcion: formData.descripcion,
                num_sedes: formData.num_sedes,
                areas_practica: formData.areas_practica,
              }
            })
          });

          if (!wpResponse.ok) {
            console.warn('Advertencia: No se pudo actualizar en WordPress, pero Supabase se actualizó correctamente');
          } else {
            console.log('✅ Despacho actualizado en WordPress');
          }
        } catch (wpError) {
          console.warn('Error al actualizar WordPress:', wpError);
          // No lanzamos error porque Supabase ya se actualizó
        }
      }

      // 4. Actualizar el estado local con los nuevos datos
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
              {!isEditing ? (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {decodeHtmlEntities(despacho.nombre)}
                </h1>
              ) : (
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="text-3xl font-bold text-gray-900 mb-2 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                  placeholder="Nombre del despacho"
                />
              )}
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
          
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar Despacho
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-green-800 font-medium">¡Despacho actualizado correctamente!</span>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-3" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Información del despacho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de contacto */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              {/* Localidad */}
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Localidad</p>
                  {!isEditing ? (
                    <p className="text-base text-gray-900">
                      {formData.localidad || 'No especificada'}
                    </p>
                  ) : (
                    <input
                      type="text"
                      name="localidad"
                      value={formData.localidad}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Madrid"
                    />
                  )}
                </div>
              </div>

              {/* Provincia */}
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Provincia</p>
                  {!isEditing ? (
                    <p className="text-base text-gray-900">
                      {formData.provincia || 'No especificada'}
                    </p>
                  ) : (
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Madrid"
                    />
                  )}
                </div>
              </div>
              
              {/* Teléfono */}
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                  {!isEditing ? (
                    formData.telefono ? (
                      <a href={`tel:${formData.telefono}`} className="text-base text-blue-600 hover:text-blue-700">
                        {formData.telefono}
                      </a>
                    ) : (
                      <p className="text-base text-gray-900">No especificado</p>
                    )
                  ) : (
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: +34 912 345 678"
                    />
                  )}
                </div>
              </div>
              
              {/* Email */}
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  {!isEditing ? (
                    formData.email ? (
                      <a href={`mailto:${formData.email}`} className="text-base text-blue-600 hover:text-blue-700">
                        {formData.email}
                      </a>
                    ) : (
                      <p className="text-base text-gray-900">No especificado</p>
                    )
                  ) : (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: contacto@despacho.com"
                    />
                  )}
                </div>
              </div>

              {/* Email de Contacto */}
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Email de Contacto</p>
                  {!isEditing ? (
                    formData.email_contacto ? (
                      <a href={`mailto:${formData.email_contacto}`} className="text-base text-blue-600 hover:text-blue-700">
                        {formData.email_contacto}
                      </a>
                    ) : (
                      <p className="text-base text-gray-900">No especificado</p>
                    )
                  ) : (
                    <input
                      type="email"
                      name="email_contacto"
                      value={formData.email_contacto}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: info@despacho.com"
                    />
                  )}
                </div>
              </div>
              
              {/* Sitio Web */}
              <div className="flex items-start">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Sitio Web</p>
                  {!isEditing ? (
                    formData.web ? (
                      <a 
                        href={formData.web} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-base text-blue-600 hover:text-blue-700"
                      >
                        {formData.web}
                      </a>
                    ) : (
                      <p className="text-base text-gray-900">No especificado</p>
                    )
                  ) : (
                    <input
                      type="url"
                      name="web"
                      value={formData.web}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: https://www.despacho.com"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
            {!isEditing ? (
              <p className="text-gray-700 leading-relaxed">
                {formData.descripcion ? decodeHtmlEntities(formData.descripcion) : 'No hay descripción disponible'}
              </p>
            ) : (
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tu despacho, servicios, especialidades, etc."
              />
            )}
          </div>

          {/* Áreas de Práctica */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Áreas de Práctica</h2>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {formData.areas_practica && formData.areas_practica.length > 0 ? (
                  formData.areas_practica.map((area, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No se han especificado áreas de práctica</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AREAS_PRACTICA.map((area) => (
                  <label key={area} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.areas_practica.includes(area)}
                      onChange={(e) => {
                        const newAreas = e.target.checked
                          ? [...formData.areas_practica, area]
                          : formData.areas_practica.filter((a) => a !== area);
                        setFormData({ ...formData, areas_practica: newAreas });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sedes del Despacho */}
          {sedes && sedes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sedes ({sedes.length})
              </h2>
              
              {/* Tabs de sedes */}
              <div className="flex gap-2 border-b mb-4 overflow-x-auto">
                {sedes.map((sede, idx) => (
                  <button
                    key={sede.id || idx}
                    onClick={() => setActiveSedeTab(idx)}
                    className={`px-4 py-2 rounded-t-lg border-b-2 -mb-px whitespace-nowrap transition-colors ${
                      activeSedeTab === idx
                        ? 'border-blue-600 text-blue-700 bg-blue-50 font-semibold'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {sede.nombre || `Sede ${idx + 1}`}
                    {sede.es_principal && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Contenido de la sede activa */}
              {sedes[activeSedeTab] && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Información de contacto de la sede */}
                    {sedes[activeSedeTab].telefono && (
                      <div className="flex items-start">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono</p>
                          <a href={`tel:${sedes[activeSedeTab].telefono}`} className="text-base text-blue-600 hover:text-blue-700">
                            {sedes[activeSedeTab].telefono}
                          </a>
                        </div>
                      </div>
                    )}

                    {sedes[activeSedeTab].email_contacto && (
                      <div className="flex items-start">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <a href={`mailto:${sedes[activeSedeTab].email_contacto}`} className="text-base text-blue-600 hover:text-blue-700">
                            {sedes[activeSedeTab].email_contacto}
                          </a>
                        </div>
                      </div>
                    )}

                    {sedes[activeSedeTab].web && (
                      <div className="flex items-start">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Web</p>
                          <a href={sedes[activeSedeTab].web} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:text-blue-700">
                            {sedes[activeSedeTab].web}
                          </a>
                        </div>
                      </div>
                    )}

                    {(sedes[activeSedeTab].localidad || sedes[activeSedeTab].provincia) && (
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Ubicación</p>
                          <p className="text-base text-gray-900">
                            {sedes[activeSedeTab].localidad}
                            {sedes[activeSedeTab].provincia && `, ${sedes[activeSedeTab].provincia}`}
                            {sedes[activeSedeTab].pais && ` - ${sedes[activeSedeTab].pais}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Áreas de práctica de la sede */}
                  {sedes[activeSedeTab].areas_practica && sedes[activeSedeTab].areas_practica!.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Áreas de Práctica</p>
                      <div className="flex flex-wrap gap-2">
                        {sedes[activeSedeTab].areas_practica!.map((area, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Descripción de la sede */}
                  {sedes[activeSedeTab].descripcion && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Descripción</p>
                      <p className="text-gray-700 text-sm">{sedes[activeSedeTab].descripcion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles</h2>
            <div className="space-y-3">
              {/* Número de Sedes */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500 flex items-center">
                  <HashtagIcon className="h-4 w-4 mr-1" />
                  Número de Sedes
                </span>
                {!isEditing ? (
                  <span className="text-base font-semibold text-gray-900">{formData.num_sedes}</span>
                ) : (
                  <input
                    type="number"
                    name="num_sedes"
                    value={formData.num_sedes}
                    onChange={handleChange}
                    min="1"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
              
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
