"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  BanknotesIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const AREAS_PRACTICA = [
  'Administrativo',
  'Bancario',
  'Civil',
  'Comercial',
  'Concursal',
  'Consumo',
  'Empresarial',
  'Familia',
  'Fiscal',
  'Inmobiliario',
  'Laboral',
  'Medio Ambiente',
  'Mercantil',
  'Penal',
  'Propiedad Intelectual',
  'Protección de Datos',
  'Salud',
  'Seguros',
  'Sucesiones',
  'Tráfico'
];

interface Sede {
  id: number;
  nombre: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  pais?: string;
  codigo_postal?: string;
  telefono?: string;
  email_contacto?: string;
  web?: string;
  descripcion?: string;
  es_principal?: boolean;
  foto_perfil?: string;
  areas_practica?: string[];
  horarios?: Record<string, string>;
}

interface RedesSociales {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  [key: string]: string | undefined;
}

interface Despacho {
  id: string;
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
  created_at: string;
  foto_perfil?: string;
  direccion?: string;
  redes_sociales?: RedesSociales;
  horarios?: Record<string, string>;
  servicios_adicionales?: string[];
  object_id?: number;
  updated_at?: string;
}

interface FormData {
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
  direccion: string;
  foto_perfil: string;
  redes_sociales: {
    twitter: string;
    linkedin: string;
    facebook: string;
    instagram: string;
  };
  horarios: Record<string, string>;
  servicios_adicionales: string[];
}

// Función para decodificar entidades HTML
const decodeHtmlEntities = (text: string): string => {
  if (typeof text !== 'string') return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Configuración de estados
const estadosConfig = {
  activo: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    label: 'Activo',
    icon: CheckCircleIcon 
  },
  inactivo: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800', 
    label: 'Inactivo',
    icon: ClockIcon
  },
  pendiente: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    label: 'Pendiente',
    icon: ClockIcon
  },
  rechazado: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    label: 'Rechazado',
    icon: XMarkIcon
  },
  verificado: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Verificado',
    icon: CheckCircleIcon
  },
  default: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    label: 'Sin estado',
    icon: ClockIcon
  }
} as const;

// Componente para mostrar el estado del despacho
const EstadoIcon = ({ 
  estado, 
  className = '' 
}: { 
  estado: string; 
  className?: string 
}) => {
  const config = estadosConfig[estado as keyof typeof estadosConfig] || estadosConfig.default;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text} ${className}`}>
      <Icon className="h-4 w-4 mr-1.5" />
      {config.label}
    </span>
  );
};

export default function DespachoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  
  const [loading, setLoading] = useState(true);
  const [despacho, setDespacho] = useState<Despacho | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
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
    direccion: '',
    foto_perfil: '',
    redes_sociales: {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: ''
    },
    horarios: {},
    servicios_adicionales: []
  });
  
  const [activeSedeTab, setActiveSedeTab] = useState(0);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDespachoData = async () => {
      if (!slug) {
        setError("Slug de despacho no proporcionado");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todos los despachos y buscar por slug
        const { data: allDespachos, error: fetchError } = await supabase
          .from("despachos")
          .select(`
            *,
            sedes(*)
          `);

        if (fetchError) {
          console.error("Error al cargar despachos:", fetchError);
          setError("No se pudo cargar la información del despacho");
          return;
        }

        // Buscar el despacho cuyo nombre coincida con el slug
        // Intentar con el slug actual y también normalizando el nombre del despacho
        const despachoData = allDespachos?.find(d => {
          const despachoSlug = slugify(d.nombre);
          console.log('Comparando:', { 
            nombre: d.nombre, 
            slugGenerado: despachoSlug, 
            slugBuscado: slug,
            coincide: despachoSlug === slug 
          });
          return despachoSlug === slug;
        });
        
        if (!despachoData) {
          console.error('No se encontró despacho con slug:', slug);
          console.log('Slugs disponibles:', allDespachos?.map(d => ({ 
            nombre: d.nombre, 
            slug: slugify(d.nombre) 
          })));
          setError("No se encontró el despacho. Verifica que el nombre sea correcto.");
          return;
        }

        // Procesar y establecer datos del despacho
        const processedDespacho: Despacho = {
          ...despachoData,
          areas_practica: Array.isArray(despachoData.areas_practica) 
            ? despachoData.areas_practica 
            : [],
          sedes: Array.isArray(despachoData.sedes) 
            ? despachoData.sedes 
            : [],
          redes_sociales: despachoData.redes_sociales || {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: ''
          },
          horarios: despachoData.horarios || {},
          servicios_adicionales: Array.isArray(despachoData.servicios_adicionales)
            ? despachoData.servicios_adicionales
            : []
        };
        
        setDespacho(processedDespacho);
        setSedes(processedDespacho.sedes || []);
        
        // Buscar la sede principal para obtener datos faltantes
        const sedePrincipal = processedDespacho.sedes?.find(s => s.es_principal) || processedDespacho.sedes?.[0];
        
        console.log('📍 Sede Principal:', sedePrincipal);
        console.log('📋 Áreas de práctica del despacho:', processedDespacho.areas_practica);
        console.log('📋 Áreas de práctica de la sede:', sedePrincipal?.areas_practica);
        console.log('📝 Descripción del despacho:', processedDespacho.descripcion);
        console.log('📝 Descripción de la sede:', sedePrincipal?.descripcion);
        console.log('✅ Estado del despacho:', processedDespacho.estado);
        console.log('✅ Verificado:', processedDespacho.verificado);
        console.log('✅ Activo:', processedDespacho.activo);
        
        // Inicializar el formulario con los datos del despacho, usando la sede principal como fallback
        setFormData({
          nombre: decodeHtmlEntities(processedDespacho.nombre || ''),
          descripcion: decodeHtmlEntities(processedDespacho.descripcion || sedePrincipal?.descripcion || ''),
          localidad: processedDespacho.localidad || sedePrincipal?.localidad || '',
          provincia: processedDespacho.provincia || sedePrincipal?.provincia || '',
          telefono: processedDespacho.telefono || sedePrincipal?.telefono || '',
          email: processedDespacho.email || sedePrincipal?.email_contacto || '',
          email_contacto: processedDespacho.email_contacto || sedePrincipal?.email_contacto || '',
          web: processedDespacho.web || sedePrincipal?.web || '',
          num_sedes: processedDespacho.num_sedes || 1,
          areas_practica: (processedDespacho.areas_practica && processedDespacho.areas_practica.length > 0) 
            ? processedDespacho.areas_practica 
            : (sedePrincipal?.areas_practica || []),
          direccion: processedDespacho.direccion || sedePrincipal?.direccion || '',
          foto_perfil: processedDespacho.foto_perfil || sedePrincipal?.foto_perfil || '',
          redes_sociales: {
            twitter: processedDespacho.redes_sociales?.twitter || '',
            linkedin: processedDespacho.redes_sociales?.linkedin || '',
            facebook: processedDespacho.redes_sociales?.facebook || '',
            instagram: processedDespacho.redes_sociales?.instagram || ''
          },
          horarios: processedDespacho.horarios || sedePrincipal?.horarios || {},
          servicios_adicionales: processedDespacho.servicios_adicionales || []
        });
        
      } catch (err) {
        console.error('Error loading despacho:', err);
        setError('Error al cargar la información del despacho');
      } finally {
        setLoading(false);
      }
    };

    fetchDespachoData();
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('redes_sociales.')) {
      const socialKey = name.split('.')[1] as keyof typeof formData.redes_sociales;
      setFormData(prev => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialKey]: value
        }
      }));
    } else if (name.startsWith('horarios.')) {
      const dia = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!despacho?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      
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
          direccion: formData.direccion,
          foto_perfil: formData.foto_perfil,
          redes_sociales: formData.redes_sociales,
          horarios: formData.horarios,
          servicios_adicionales: formData.servicios_adicionales,
          updated_at: new Date().toISOString()
        })
        .eq('id', despacho.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Si el nombre cambió, redirigir al nuevo slug
      const newSlug = slugify(formData.nombre);
      if (newSlug !== slug) {
        router.push(`/dashboard/despachos/${newSlug}`);
      } else {
        // Recargar los datos
        window.location.reload();
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al actualizar el despacho:', error);
      setError('Error al actualizar el despacho');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando despacho...</p>
        </div>
      </div>
    );
  }

  if (error || !despacho) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <XMarkIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar el despacho</h3>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la información del despacho'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-700 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver al Dashboard</span>
            </button>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar Despacho
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {success && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm animate-fade-in">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
              <p className="text-green-800 font-medium">¡Cambios guardados exitosamente!</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con nombre del despacho, estado y fecha */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">
              {decodeHtmlEntities(formData.nombre)}
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Creado el</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(despacho?.created_at || '').toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <EstadoIcon estado={despacho?.estado || (despacho?.activo ? 'activo' : 'pendiente')} />
            </div>
          </div>
        </div>

        {/* Sedes del Despacho - Ancho completo */}
        {sedes && sedes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BuildingOfficeIcon className="h-7 w-7 text-blue-600 mr-3" />
              Sedes ({sedes.length})
            </h2>
            
            {/* Tabs de sedes */}
            <div className="flex gap-2 border-b-2 border-gray-200 mb-6 overflow-x-auto pb-2">
              {sedes.map((sede, idx) => (
                <button
                  key={sede.id || idx}
                  onClick={() => setActiveSedeTab(idx)}
                  className={`px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-all ${
                    activeSedeTab === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sede.nombre || `Sede ${idx + 1}`}
                  {sede.es_principal && (
                    <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                      Principal
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Contenido de la sede activa */}
            {sedes[activeSedeTab] && (
              <div className="space-y-6">
                {/* Grid de información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sedes[activeSedeTab].telefono && (
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <PhoneIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                        <a href={`tel:${sedes[activeSedeTab].telefono}`} className="text-base font-semibold text-blue-600 hover:text-blue-700">
                          {sedes[activeSedeTab].telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {sedes[activeSedeTab].email_contacto && (
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <EnvelopeIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                        <a href={`mailto:${sedes[activeSedeTab].email_contacto}`} className="text-base font-semibold text-blue-600 hover:text-blue-700 break-all">
                          {sedes[activeSedeTab].email_contacto}
                        </a>
                      </div>
                    </div>
                  )}

                  {sedes[activeSedeTab].web && (
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Sitio Web</p>
                        <a href={sedes[activeSedeTab].web} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-blue-600 hover:text-blue-700 break-all">
                          {sedes[activeSedeTab].web}
                        </a>
                      </div>
                    </div>
                  )}

                  {(sedes[activeSedeTab].localidad || sedes[activeSedeTab].provincia) && (
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <MapPinIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Ubicación</p>
                        <p className="text-base font-semibold text-gray-900">
                          {sedes[activeSedeTab].direccion && `${sedes[activeSedeTab].direccion}, `}
                          {sedes[activeSedeTab].localidad}
                          {sedes[activeSedeTab].provincia && `, ${sedes[activeSedeTab].provincia}`}
                          {sedes[activeSedeTab].pais && ` - ${sedes[activeSedeTab].pais}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Descripción de la sede */}
                {sedes[activeSedeTab].descripcion && (
                  <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Descripción
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{sedes[activeSedeTab].descripcion}</p>
                  </div>
                )}

                {/* Áreas de práctica de la sede */}
                {sedes[activeSedeTab].areas_practica && sedes[activeSedeTab].areas_practica!.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <BanknotesIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Áreas de Práctica
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sedes[activeSedeTab].areas_practica!.map((area, idx) => (
                        <span key={idx} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm font-medium px-4 py-2 rounded-full border border-purple-200">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Descripción */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-7 w-7 text-blue-600 mr-3" />
                Descripción
              </h2>
              {!isEditing ? (
                <div>
                  {formData.descripcion ? (
                    <p className="text-gray-700 leading-relaxed text-base">
                      {decodeHtmlEntities(formData.descripcion)}
                    </p>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No hay descripción disponible</p>
                      <p className="text-sm text-gray-400 mt-1">Agrega una descripción para que los usuarios conozcan más sobre tu despacho</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe tu despacho, servicios, especialidades, etc."
                />
              )}
            </div>

            {/* Áreas de Práctica */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BanknotesIcon className="h-7 w-7 text-blue-600 mr-3" />
                Áreas de Práctica
              </h2>
              {!isEditing ? (
                <div className="flex flex-wrap gap-3">
                  {formData.areas_practica && formData.areas_practica.length > 0 ? (
                    formData.areas_practica.map((area, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full border border-blue-200"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No se han especificado áreas de práctica</p>
                      <p className="text-sm text-gray-400 mt-1">Agrega las áreas de práctica de tu despacho para que los clientes sepan en qué te especializas</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AREAS_PRACTICA.map((area) => (
                    <label key={area} className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.areas_practica.includes(area)}
                        onChange={(e) => {
                          const newAreas = e.target.checked
                            ? [...formData.areas_practica, area]
                            : formData.areas_practica.filter((a) => a !== area);
                          setFormData({ ...formData, areas_practica: newAreas });
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">{area}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard/leads")}
                  className="w-full bg-white text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center justify-center border border-gray-200 shadow-sm hover:shadow"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Ver Leads
                </button>
                <button
                  onClick={() => router.push("/dashboard/settings?tab=mis-despachos")}
                  className="w-full bg-white text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center justify-center border border-gray-200 shadow-sm hover:shadow"
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Mis Despachos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
