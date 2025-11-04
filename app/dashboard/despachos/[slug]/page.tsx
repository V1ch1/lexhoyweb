"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { slugify } from "@/lib/slugify";
import {
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const AREAS_PRACTICA_DISPONIBLES = [
  'Administrativo', 'Bancario', 'Civil', 'Comercial', 'Concursal', 'Consumo',
  'Empresarial', 'Familia', 'Fiscal', 'Inmobiliario', 'Laboral', 'Medio Ambiente',
  'Mercantil', 'Penal', 'Propiedad Intelectual', 'Protección de Datos', 'Salud',
  'Seguros', 'Sucesiones', 'Tráfico', 'Urbanismo', 'Vivienda'
];

interface Sede {
  id: string; // UUID
  nombre: string;
  descripcion?: string;
  web?: string;
  ano_fundacion?: string;
  tamano_despacho?: string;
  persona_contacto?: string;
  email_contacto?: string;
  telefono?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  especialidades?: string;
  servicios_especificos?: string;
  estado_verificacion?: string;
  estado_registro?: string;
  foto_perfil?: string;
  is_verified?: boolean;
  observaciones?: string;
  es_principal?: boolean;
  activa?: boolean;
  horarios?: Record<string, string>;
  redes_sociales?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  areas_practica?: string[];
  direccion?: string;
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
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') return text;
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
  const [savingSede, setSavingSede] = useState(false);
  const [editingSedeId, setEditingSedeId] = useState<string | null>(null); // UUID
  const [editSedeData, setEditSedeData] = useState<Sede | null>(null);
  const [isCreatingNewSede, setIsCreatingNewSede] = useState(false);
  const [newSedeData, setNewSedeData] = useState<Partial<Sede> | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // Error específico del formulario
  const [showDeleteSedeModal, setShowDeleteSedeModal] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);
  const [deletingSede, setDeletingSede] = useState(false);

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
        // Ordenar sedes: principal primero
        const sedesOrdenadas = [...(processedDespacho.sedes || [])].sort((a, b) => {
          if (a.es_principal) return -1;
          if (b.es_principal) return 1;
          return 0;
        });
        setSedes(sedesOrdenadas);
        
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

  // Función para manejar cambios en el formulario (para futuras ediciones)
  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, value } = e.target;
  //   
  //   if (name.startsWith('redes_sociales.')) {
  //     const socialKey = name.split('.')[1] as keyof typeof formData.redes_sociales;
  //     setFormData(prev => ({
  //       ...prev,
  //       redes_sociales: {
  //         ...prev.redes_sociales,
  //         [socialKey]: value
  //       }
  //     }));
  //   } else if (name.startsWith('horarios.')) {
  //     const dia = name.split('.')[1];
  //     setFormData(prev => ({
  //       ...prev,
  //       horarios: {
  //         ...prev.horarios,
  //         [dia]: value
  //       }
  //     }));
  //   } else {
  //     setFormData(prev => ({
  //       ...prev,
  //       [name]: value
  //     }));
  //   }
  // };

  const handleSaveSede = async () => {
    if (!editSedeData || !editingSedeId) return;
    
    try {
      setSavingSede(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('sedes')
        .update({
          nombre: editSedeData.nombre,
          descripcion: editSedeData.descripcion,
          telefono: editSedeData.telefono,
          email_contacto: editSedeData.email_contacto,
          web: editSedeData.web,
          persona_contacto: editSedeData.persona_contacto,
          calle: editSedeData.calle,
          numero: editSedeData.numero,
          piso: editSedeData.piso,
          codigo_postal: editSedeData.codigo_postal,
          localidad: editSedeData.localidad,
          provincia: editSedeData.provincia,
          pais: editSedeData.pais,
          ano_fundacion: editSedeData.ano_fundacion,
          tamano_despacho: editSedeData.tamano_despacho,
          numero_colegiado: editSedeData.numero_colegiado,
          colegio: editSedeData.colegio,
          experiencia: editSedeData.experiencia,
          especialidades: editSedeData.especialidades,
          servicios_especificos: editSedeData.servicios_especificos,
          horarios: editSedeData.horarios,
          redes_sociales: editSedeData.redes_sociales,
          observaciones: editSedeData.observaciones,
          foto_perfil: editSedeData.foto_perfil,
          areas_practica: editSedeData.areas_practica,
          es_principal: editSedeData.es_principal || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSedeId);

      if (updateError) {
        throw updateError;
      }

      // Actualizar los datos localmente sin recargar la página
      const sedesActualizadas = sedes.map(sede => 
        sede.id === editingSedeId ? {...sede, ...editSedeData} : sede
      );
      setSedes(sedesActualizadas);

      // Sincronizar con WordPress si el despacho tiene object_id
      // TEMPORALMENTE DESHABILITADO - Problema de autenticación con WordPress
      /*
      if (despacho?.object_id) {
        console.log('🔄 Sincronizando cambios con WordPress...');
        try {
          const syncResponse = await fetch('/api/sync-despacho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              despachoId: despacho.id,
              objectId: despacho.object_id 
            })
          });

          if (syncResponse.ok) {
            console.log('✅ Sincronizado con WordPress');
          } else {
            console.warn('⚠️ Error al sincronizar con WordPress:', await syncResponse.text());
          }
        } catch (syncError) {
          console.error('❌ Error en sincronización con WordPress:', syncError);
          // No mostramos error al usuario, solo log
        }
      }
      */
      console.log('ℹ️ Sincronización con WordPress deshabilitada temporalmente');

      setSuccess(true);
      setEditingSedeId(null);
      setEditSedeData(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al actualizar la sede:', error);
      setError('Error al actualizar la sede');
    } finally {
      setSavingSede(false);
    }
  };

  const handleCreateNewSede = () => {
    setIsCreatingNewSede(true);
    setEditingSedeId(null);
    setFormError(null); // Limpiar errores previos
    setNewSedeData({
      nombre: '',
      descripcion: '',
      telefono: '',
      email_contacto: '',
      web: '',
      persona_contacto: '',
      calle: '',
      numero: '',
      piso: '',
      codigo_postal: '',
      localidad: '',
      provincia: '',
      pais: 'España',
      ano_fundacion: '',
      tamano_despacho: '',
      numero_colegiado: '',
      colegio: '',
      experiencia: '',
      especialidades: '',
      servicios_especificos: '',
      horarios: {
        lunes: '',
        martes: '',
        miercoles: '',
        jueves: '',
        viernes: '',
        sabado: '',
        domingo: ''
      },
      redes_sociales: {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: ''
      },
      observaciones: '',
      foto_perfil: '',
      areas_practica: [],
      es_principal: sedes.length === 0, // Si no hay sedes, esta será la principal
      activa: true,
    });
  };

  const handleSaveNewSede = async () => {
    if (!newSedeData || !despacho) return;
    
    // Validaciones de campos obligatorios
    if (!newSedeData.nombre || newSedeData.nombre.trim() === '') {
      setFormError('El nombre de la sede es obligatorio');
      return;
    }
    
    if (!newSedeData.localidad || newSedeData.localidad.trim() === '') {
      setFormError('La localidad es obligatoria');
      return;
    }
    
    if (!newSedeData.provincia || newSedeData.provincia.trim() === '') {
      setFormError('La provincia es obligatoria');
      return;
    }
    
    if (!newSedeData.telefono || newSedeData.telefono.trim() === '') {
      setFormError('El teléfono es obligatorio');
      return;
    }
    
    if (!newSedeData.email_contacto || newSedeData.email_contacto.trim() === '') {
      setFormError('El email de contacto es obligatorio');
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSedeData.email_contacto)) {
      setFormError('El formato del email no es válido');
      return;
    }
    
    try {
      setSavingSede(true);
      setFormError(null);
      
      const { data: nuevaSede, error: insertError } = await supabase
        .from('sedes')
        .insert({
          despacho_id: despacho.id,
          nombre: newSedeData.nombre || 'Nueva Sede',
          descripcion: newSedeData.descripcion || '',
          telefono: newSedeData.telefono || '',
          email_contacto: newSedeData.email_contacto || '',
          web: newSedeData.web || '',
          persona_contacto: newSedeData.persona_contacto || '',
          calle: newSedeData.calle || '',
          numero: newSedeData.numero || '',
          piso: newSedeData.piso || '',
          codigo_postal: newSedeData.codigo_postal || '',
          localidad: newSedeData.localidad || '',
          provincia: newSedeData.provincia || '',
          pais: newSedeData.pais || 'España',
          ano_fundacion: newSedeData.ano_fundacion ? parseInt(newSedeData.ano_fundacion) : null,
          tamano_despacho: newSedeData.tamano_despacho || '',
          numero_colegiado: newSedeData.numero_colegiado || '',
          colegio: newSedeData.colegio || '',
          experiencia: newSedeData.experiencia || '',
          especialidades: newSedeData.especialidades || '',
          servicios_especificos: newSedeData.servicios_especificos || '',
          horarios: newSedeData.horarios || {},
          redes_sociales: newSedeData.redes_sociales || {},
          observaciones: newSedeData.observaciones || '',
          foto_perfil: newSedeData.foto_perfil || '',
          areas_practica: newSedeData.areas_practica || [],
          es_principal: newSedeData.es_principal || false,
          activa: true,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Añadir la nueva sede a la lista
      const sedesActualizadas = [...sedes, nuevaSede as Sede];
      setSedes(sedesActualizadas);
      
      // Actualizar el contador de sedes en el despacho
      await supabase
        .from('despachos')
        .update({ num_sedes: sedesActualizadas.length })
        .eq('id', despacho.id);

      setSuccess(true);
      setIsCreatingNewSede(false);
      setNewSedeData(null);
      setActiveSedeTab(sedesActualizadas.length - 1); // Ir a la nueva sede
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al crear la sede:', error);
      setError('Error al crear la sede');
    } finally {
      setSavingSede(false);
    }
  };

  const handleDeleteSede = async () => {
    if (!sedeToDelete || !despacho) return;

    // Validaciones
    if (sedes.length === 1) {
      setFormError('No puedes eliminar la única sede del despacho');
      setShowDeleteSedeModal(false);
      return;
    }

    if (sedeToDelete.es_principal) {
      setFormError('No puedes eliminar la sede principal. Primero cambia la sede principal a otra.');
      setShowDeleteSedeModal(false);
      return;
    }

    try {
      setDeletingSede(true);
      setFormError(null);

      console.log('🗑️ Eliminando sede:', sedeToDelete.nombre);

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar al endpoint DELETE con token de autenticación
      const response = await fetch(`/api/despachos/${despacho.id}/sedes/${sedeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al eliminar la sede');
      }

      console.log('✅ Sede eliminada exitosamente');

      // Actualizar estado local
      const sedesActualizadas = sedes.filter(s => s.id !== sedeToDelete.id);
      setSedes(sedesActualizadas);

      // Actualizar contador de sedes
      await supabase
        .from('despachos')
        .update({ num_sedes: sedesActualizadas.length })
        .eq('id', despacho.id);

      // Si estábamos en la sede eliminada, ir a la primera
      if (activeSedeTab >= sedesActualizadas.length) {
        setActiveSedeTab(0);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al eliminar sede:', error);
      setFormError(error instanceof Error ? error.message : 'Error al eliminar la sede');
    } finally {
      setDeletingSede(false);
      setShowDeleteSedeModal(false);
      setSedeToDelete(null);
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {decodeHtmlEntities(formData.nombre)}
                </h1>
              </div>
              <div className="text-sm text-gray-600">
                <span>Creado el {new Date(despacho?.created_at || '').toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EstadoIcon estado={despacho?.estado || 'activo'} />
              {despacho?.verificado || sedes?.some(sede => sede.es_principal && sede.is_verified) ? (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>Verificado</span>
                </div>
              ) : (
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>No verificado</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sedes del Despacho */}
        {sedes && sedes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
                Sedes ({sedes.length})
              </h2>
              <div className="flex gap-2">
                {editingSedeId && (
                  <button
                    onClick={() => setEditingSedeId(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancelar edición
                  </button>
                )}
                {!isCreatingNewSede && !editingSedeId && (
                  <button
                    onClick={handleCreateNewSede}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <BuildingOfficeIcon className="h-4 w-4" />
                    Añadir Nueva Sede
                  </button>
                )}
                {isCreatingNewSede && (
                  <button
                    onClick={() => {
                      setIsCreatingNewSede(false);
                      setNewSedeData(null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Sede Principal */}
            {sedes.length > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <label htmlFor="sede-principal-select" className="text-sm font-medium text-gray-900">
                      Sede Principal:
                    </label>
                  </div>
                  <select
                    id="sede-principal-select"
                    value={sedes.find(s => s.es_principal)?.id || sedes[0]?.id || ''}
                    onChange={async (e) => {
                      const nuevaSedeId = e.target.value; // UUID es string, no número
                      try {
                        console.log('🔄 Cambiando sede principal a:', nuevaSedeId);
                        
                        // Actualizar en la base de datos
                        const { error } = await supabase
                          .from('sedes')
                          .update({ es_principal: true })
                          .eq('id', nuevaSedeId);

                        if (error) {
                          console.error('❌ Error al actualizar sede principal:', error);
                          throw error;
                        }

                        console.log('✅ Sede principal actualizada en BD');

                        // Actualizar estado local y reordenar (principal primero)
                        const sedesActualizadas = sedes.map(sede => ({
                          ...sede,
                          es_principal: sede.id === nuevaSedeId
                        })).sort((a, b) => {
                          if (a.es_principal) return -1;
                          if (b.es_principal) return 1;
                          return 0;
                        });
                        
                        setSedes(sedesActualizadas);
                        setActiveSedeTab(0); // Ir a la primera sede (la nueva principal)
                        
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 2000);
                      } catch (error) {
                        console.error('❌ Error al cambiar sede principal:', error);
                        setFormError('Error al cambiar la sede principal. Por favor, intenta de nuevo.');
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-yellow-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  La sede principal es la que aparece por defecto en tu perfil público
                </p>
              </div>
            )}
            
            {/* Tabs de sedes */}
            <div className="flex gap-2 border-b border-gray-200 mb-4 overflow-x-auto">
              {sedes.map((sede, idx) => (
                <button
                  key={sede.id || idx}
                  onClick={() => {
                    setActiveSedeTab(idx);
                    setEditingSedeId(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeSedeTab === idx
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {sede.nombre || `Sede ${idx + 1}`}
                  {sede.es_principal && (
                    <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Formulario para crear nueva sede */}
            {isCreatingNewSede && newSedeData && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Nueva Sede</h3>
                  <button
                    onClick={handleSaveNewSede}
                    disabled={savingSede}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {savingSede ? 'Guardando...' : 'Guardar Nueva Sede'}
                  </button>
                </div>

                {/* Mensaje de error */}
                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <XMarkIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 font-medium">
                          {formError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos obligatorios */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>* Campos obligatorios:</strong> Nombre, Localidad, Provincia, Teléfono, Email
                  </p>
                </div>

                {/* Información básica */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Información Básica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nombre de la Sede *</label>
                      <input
                        type="text"
                        value={newSedeData.nombre || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, nombre: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Sede Central Madrid"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email de Contacto *</label>
                      <input
                        type="email"
                        value={newSedeData.email_contacto || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, email_contacto: e.target.value} : null)}
                        required
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contacto@despacho.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Teléfono *</label>
                      <input
                        type="tel"
                        value={newSedeData.telefono || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, telefono: e.target.value} : null)}
                        required
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="912 345 678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={newSedeData.persona_contacto || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, persona_contacto: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre del responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Web</label>
                      <input
                        type="url"
                        value={newSedeData.web || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, web: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Año de Fundación</label>
                      <input
                        type="text"
                        value={newSedeData.ano_fundacion || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, ano_fundacion: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tamaño del Despacho</label>
                      <select
                        value={newSedeData.tamano_despacho || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, tamano_despacho: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="1-5">1-5 abogados</option>
                        <option value="6-10">6-10 abogados</option>
                        <option value="11-25">11-25 abogados</option>
                        <option value="26-50">26-50 abogados</option>
                        <option value="51+">Más de 50 abogados</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                    <textarea
                      value={newSedeData.descripcion || ''}
                      onChange={(e) => setNewSedeData(prev => prev ? {...prev, descripcion: e.target.value} : null)}
                      rows={3}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción de la sede"
                    />
                  </div>
                </div>

                {/* Foto de Perfil */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Foto de Perfil (500x500px)</h4>
                  <div className="flex items-center space-x-6">
                    {/* Preview de la foto */}
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {newSedeData.foto_perfil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={newSedeData.foto_perfil} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Input de archivo */}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-block text-sm">
                        <span className="text-gray-700">Subir foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validar tamaño (máx 2MB)
                              if (file.size > 2 * 1024 * 1024) {
                                setFormError('La imagen no debe superar 2MB');
                                return;
                              }
                              
                              // Crear preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewSedeData(prev => prev ? {...prev, foto_perfil: reader.result as string} : null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG o GIF. Máximo 2MB.
                      </p>
                      <p className="text-xs text-gray-500">
                        La imagen debe ser exactamente 500x500 píxeles
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Calle</label>
                      <input
                        type="text"
                        value={newSedeData.calle || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, calle: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Calle Principal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Número</label>
                      <input
                        type="text"
                        value={newSedeData.numero || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, numero: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Piso</label>
                      <input
                        type="text"
                        value={newSedeData.piso || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, piso: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="3º A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Código Postal</label>
                      <input
                        type="text"
                        value={newSedeData.codigo_postal || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, codigo_postal: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="28001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Localidad *</label>
                      <input
                        type="text"
                        value={newSedeData.localidad || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, localidad: e.target.value} : null)}
                        required
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Madrid"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Provincia *</label>
                      <input
                        type="text"
                        value={newSedeData.provincia || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, provincia: e.target.value} : null)}
                        required
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Madrid"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">País</label>
                      <input
                        type="text"
                        value={newSedeData.pais || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, pais: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="España"
                      />
                    </div>
                  </div>
                </div>

                {/* Información Profesional */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Información Profesional</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nº Colegiado</label>
                      <input
                        type="text"
                        value={newSedeData.numero_colegiado || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, numero_colegiado: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Colegio</label>
                      <input
                        type="text"
                        value={newSedeData.colegio || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, colegio: e.target.value} : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ilustre Colegio de Abogados de..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Experiencia</label>
                      <textarea
                        value={newSedeData.experiencia || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, experiencia: e.target.value} : null)}
                        rows={2}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Años de experiencia y especialización..."
                      />
                    </div>
                  </div>
                </div>

                {/* Áreas de Práctica */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Áreas de Práctica</h4>
                  <div className="flex flex-wrap gap-2">
                    {AREAS_PRACTICA_DISPONIBLES.map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          const current = newSedeData.areas_practica || [];
                          const updated = current.includes(area)
                            ? current.filter(a => a !== area)
                            : [...current, area];
                          setNewSedeData(prev => prev ? {...prev, areas_practica: updated} : null);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                          (newSedeData.areas_practica || []).includes(area)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Especialidades y Servicios */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Especialidades y Servicios</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Especialidades</label>
                      <textarea
                        value={newSedeData.especialidades || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, especialidades: e.target.value} : null)}
                        rows={2}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Especialidades específicas..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Servicios Específicos</label>
                      <textarea
                        value={newSedeData.servicios_especificos || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {...prev, servicios_especificos: e.target.value} : null)}
                        rows={2}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Servicios que ofrece..."
                      />
                    </div>
                  </div>
                </div>

                {/* Horarios */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Horarios</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => (
                      <div key={dia}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">{dia}:</label>
                        <input
                          type="text"
                          value={(newSedeData.horarios as Record<string, string>)?.[dia] || ''}
                          onChange={(e) => setNewSedeData(prev => prev ? {
                            ...prev,
                            horarios: {...(prev.horarios as Record<string, string>), [dia]: e.target.value}
                          } : null)}
                          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="9:00-14:00, 16:00-19:00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redes Sociales */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Redes Sociales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                      <input
                        type="url"
                        value={(newSedeData.redes_sociales as Record<string, string>)?.facebook || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {
                          ...prev,
                          redes_sociales: {...(prev.redes_sociales as Record<string, string>), facebook: e.target.value}
                        } : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Twitter</label>
                      <input
                        type="url"
                        value={(newSedeData.redes_sociales as Record<string, string>)?.twitter || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {
                          ...prev,
                          redes_sociales: {...(prev.redes_sociales as Record<string, string>), twitter: e.target.value}
                        } : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={(newSedeData.redes_sociales as Record<string, string>)?.linkedin || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {
                          ...prev,
                          redes_sociales: {...(prev.redes_sociales as Record<string, string>), linkedin: e.target.value}
                        } : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                      <input
                        type="url"
                        value={(newSedeData.redes_sociales as Record<string, string>)?.instagram || ''}
                        onChange={(e) => setNewSedeData(prev => prev ? {
                          ...prev,
                          redes_sociales: {...(prev.redes_sociales as Record<string, string>), instagram: e.target.value}
                        } : null)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Observaciones</h4>
                  <textarea
                    value={newSedeData.observaciones || ''}
                    onChange={(e) => setNewSedeData(prev => prev ? {...prev, observaciones: e.target.value} : null)}
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            )}

            {/* Contenido de la sede activa - Versión compacta */}
            {!isCreatingNewSede && sedes[activeSedeTab] && (
              <div className="space-y-4">
                {/* Botones de acción */}
                <div className="flex justify-end gap-2">
                  {editingSedeId === sedes[activeSedeTab].id && (
                    <button
                      onClick={handleSaveSede}
                      disabled={savingSede}
                      className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      {savingSede ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (editingSedeId === sedes[activeSedeTab].id) {
                        setEditingSedeId(null);
                        setEditSedeData(null);
                      } else {
                        setEditingSedeId(sedes[activeSedeTab].id);
                        setEditSedeData({...sedes[activeSedeTab]});
                      }
                    }}
                    className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {editingSedeId === sedes[activeSedeTab].id ? 'Cancelar Edición' : 'Editar Sede'}
                  </button>
                  {sedes.length > 1 && !sedes[activeSedeTab].es_principal && (
                    <button
                      onClick={() => {
                        setSedeToDelete(sedes[activeSedeTab]);
                        setShowDeleteSedeModal(true);
                      }}
                      className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      title="Eliminar sede"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar Sede
                    </button>
                  )}
                </div>

                {/* Foto de perfil con uploader */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Foto de Perfil (500x500px)</h3>
                  {editingSedeId === sedes[activeSedeTab].id ? (
                    <div className="space-y-3">
                      {editSedeData?.foto_perfil && (
                        <Image 
                          src={editSedeData.foto_perfil} 
                          alt="Foto de perfil" 
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Validar dimensiones
                          const img = document.createElement('img');
                          img.onload = function() {
                            if (img.width !== 500 || img.height !== 500) {
                              alert('La imagen debe ser exactamente 500x500 píxeles');
                              if (e.target) {
                                (e.target as HTMLInputElement).value = '';
                              }
                              return;
                            }
                            
                            // Convertir a base64 o URL
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditSedeData(prev => prev ? {...prev, foto_perfil: reader.result as string} : null);
                            };
                            reader.readAsDataURL(file);
                            
                            // Liberar el objeto URL creado
                            URL.revokeObjectURL(img.src);
                          };
                          img.onerror = () => {
                            console.error('Error al cargar la imagen');
                            if (e.target) {
                              (e.target as HTMLInputElement).value = '';
                            }
                          };
                          img.src = URL.createObjectURL(file);
                        }}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">La imagen debe ser exactamente 500x500 píxeles</p>
                    </div>
                  ) : (
                    sedes[activeSedeTab].foto_perfil ? (
                      <Image 
                        src={sedes[activeSedeTab].foto_perfil} 
                        alt="Foto de perfil" 
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">No especificado</p>
                    )
                  )}
                </div>

                {/* Descripción */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                  {editingSedeId === sedes[activeSedeTab].id ? (
                    <textarea
                      value={editSedeData?.descripcion || ''}
                      onChange={(e) => setEditSedeData(prev => prev ? {...prev, descripcion: e.target.value} : null)}
                      rows={4}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción de la sede"
                    />
                  ) : (
                    sedes[activeSedeTab].descripcion ? (
                      <p className="text-sm text-gray-600 leading-relaxed">{sedes[activeSedeTab].descripcion}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No especificado</p>
                    )
                  )}
                </div>

                {/* Grid compacto de información - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="tel"
                          value={editSedeData?.telefono || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, telefono: e.target.value} : null)}
                          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Teléfono"
                        />
                      ) : (
                        sedes[activeSedeTab].telefono ? (
                          <a href={`tel:${sedes[activeSedeTab].telefono}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            {sedes[activeSedeTab].telefono}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="email"
                          value={editSedeData?.email_contacto || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, email_contacto: e.target.value} : null)}
                          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Email"
                        />
                      ) : (
                        sedes[activeSedeTab].email_contacto ? (
                          <a href={`mailto:${sedes[activeSedeTab].email_contacto}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all">
                            {sedes[activeSedeTab].email_contacto}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Web</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="url"
                          value={editSedeData?.web || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, web: e.target.value} : null)}
                          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                      ) : (
                        sedes[activeSedeTab].web ? (
                          <a href={sedes[activeSedeTab].web} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all">
                            {sedes[activeSedeTab].web}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Persona de Contacto</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="text"
                          value={editSedeData?.persona_contacto || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, persona_contacto: e.target.value} : null)}
                          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nombre de contacto"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].persona_contacto || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ubicación - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Calle</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.calle || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, calle: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Calle" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].calle || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Número</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.numero || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, numero: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Número" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].numero || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Piso</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.piso || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, piso: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Piso" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].piso || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Código Postal</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.codigo_postal || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, codigo_postal: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="CP" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].codigo_postal || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Localidad</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.localidad || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, localidad: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Localidad" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].localidad || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Provincia</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.provincia || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, provincia: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Provincia" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].provincia || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">País</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.pais || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, pais: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="País" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].pais || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Profesional - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Información Profesional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Año Fundación</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.ano_fundacion || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, ano_fundacion: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Año" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].ano_fundacion || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tamaño del Despacho</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.tamano_despacho || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, tamano_despacho: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Tamaño" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].tamano_despacho || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nº Colegiado</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.numero_colegiado || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, numero_colegiado: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Nº Colegiado" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].numero_colegiado || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Colegio</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.colegio || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, colegio: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Colegio" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].colegio || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Experiencia</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input type="text" value={editSedeData?.experiencia || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, experiencia: e.target.value} : null)} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Experiencia" />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{sedes[activeSedeTab].experiencia || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Áreas de Práctica - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Áreas de Práctica</h3>
                  {editingSedeId === sedes[activeSedeTab].id ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {AREAS_PRACTICA_DISPONIBLES.map((area) => (
                        <label key={area} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={editSedeData?.areas_practica?.includes(area) || false}
                            onChange={(e) => {
                              const currentAreas = editSedeData?.areas_practica || [];
                              const newAreas = e.target.checked
                                ? [...currentAreas, area]
                                : currentAreas.filter(a => a !== area);
                              setEditSedeData(prev => prev ? {...prev, areas_practica: newAreas} : null);
                            }}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{area}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    sedes[activeSedeTab].areas_practica && sedes[activeSedeTab].areas_practica!.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sedes[activeSedeTab].areas_practica!.map((area, idx) => (
                          <span key={idx} className="bg-white text-gray-700 text-xs font-medium px-3 py-1 rounded-full border border-gray-300">
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No especificado</p>
                    )
                  )}
                </div>

                {/* Especialidades y Servicios - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Especialidades y Servicios</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Especialidades</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <textarea value={editSedeData?.especialidades || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, especialidades: e.target.value} : null)} rows={2} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Especialidades" />
                      ) : (
                        <p className="text-sm text-gray-700">{sedes[activeSedeTab].especialidades || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Servicios Específicos</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <textarea value={editSedeData?.servicios_especificos || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, servicios_especificos: e.target.value} : null)} rows={2} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Servicios específicos" />
                      ) : (
                        <p className="text-sm text-gray-700">{sedes[activeSedeTab].servicios_especificos || <span className="text-gray-400 italic">No especificado</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horarios - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Horarios</h3>
                  {editingSedeId === sedes[activeSedeTab].id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                        <div key={dia} className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-700 capitalize w-20">{dia}:</label>
                          <input
                            type="text"
                            value={editSedeData?.horarios?.[dia] || ''}
                            onChange={(e) => setEditSedeData(prev => prev ? {...prev, horarios: {...(prev.horarios || {}), [dia]: e.target.value}} : null)}
                            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="ej: 9:00-14:00"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    sedes[activeSedeTab].horarios && Object.keys(sedes[activeSedeTab].horarios!).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(sedes[activeSedeTab].horarios!).map(([dia, horario]) => (
                          <div key={dia} className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700 capitalize">{dia}:</span>
                            <span className="text-gray-600">{horario}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No especificado</p>
                    )
                  )}
                </div>

                {/* Redes Sociales - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Redes Sociales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Facebook</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="url"
                          value={editSedeData?.redes_sociales?.facebook || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, redes_sociales: {...(prev.redes_sociales || {}), facebook: e.target.value}} : null)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/..."
                        />
                      ) : (
                        sedes[activeSedeTab].redes_sociales?.facebook ? (
                          <a href={sedes[activeSedeTab].redes_sociales.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 break-all">
                            {sedes[activeSedeTab].redes_sociales.facebook}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Twitter</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="url"
                          value={editSedeData?.redes_sociales?.twitter || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, redes_sociales: {...(prev.redes_sociales || {}), twitter: e.target.value}} : null)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="https://twitter.com/..."
                        />
                      ) : (
                        sedes[activeSedeTab].redes_sociales?.twitter ? (
                          <a href={sedes[activeSedeTab].redes_sociales.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 break-all">
                            {sedes[activeSedeTab].redes_sociales.twitter}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">LinkedIn</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="url"
                          value={editSedeData?.redes_sociales?.linkedin || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, redes_sociales: {...(prev.redes_sociales || {}), linkedin: e.target.value}} : null)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="https://linkedin.com/..."
                        />
                      ) : (
                        sedes[activeSedeTab].redes_sociales?.linkedin ? (
                          <a href={sedes[activeSedeTab].redes_sociales.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:text-blue-800 break-all">
                            {sedes[activeSedeTab].redes_sociales.linkedin}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Instagram</p>
                      {editingSedeId === sedes[activeSedeTab].id ? (
                        <input
                          type="url"
                          value={editSedeData?.redes_sociales?.instagram || ''}
                          onChange={(e) => setEditSedeData(prev => prev ? {...prev, redes_sociales: {...(prev.redes_sociales || {}), instagram: e.target.value}} : null)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/..."
                        />
                      ) : (
                        sedes[activeSedeTab].redes_sociales?.instagram ? (
                          <a href={sedes[activeSedeTab].redes_sociales.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-600 hover:text-pink-700 break-all">
                            {sedes[activeSedeTab].redes_sociales.instagram}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No especificado</p>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Observaciones - SIEMPRE visible */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Observaciones</h3>
                  {editingSedeId === sedes[activeSedeTab].id ? (
                    <textarea value={editSedeData?.observaciones || ''} onChange={(e) => setEditSedeData(prev => prev ? {...prev, observaciones: e.target.value} : null)} rows={3} className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Observaciones" />
                  ) : (
                    <p className="text-sm text-gray-600">{sedes[activeSedeTab].observaciones || <span className="text-gray-400 italic">No especificado</span>}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar sede */}
      {showDeleteSedeModal && sedeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">¿Eliminar sede?</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                ¿Estás seguro de que deseas eliminar la sede <strong>{sedeToDelete.nombre}</strong>?
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Esta acción marcará la sede como inactiva. No se eliminará permanentemente de la base de datos.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteSedeModal(false);
                  setSedeToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={deletingSede}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSede}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={deletingSede}
              >
                {deletingSede ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
