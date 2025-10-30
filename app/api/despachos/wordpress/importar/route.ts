import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://despachos.lexhoy.com/wp-json/wp/v2';

/**
 * Represents a location/office of a law firm
 */
interface SedeWP {
  id?: number;
  nombre?: string;
  calle?: string;
  direccion?: string; // Alternative to calle
  localidad?: string;
  provincia?: string;
  pais?: string;
  codigo_postal?: string;
  telefono?: string;
  email_contacto?: string;
  latitud?: number | string;
  longitud?: number | string;
  horario?: string;
  es_principal?: boolean;
  [key: string]: unknown; // For any additional fields
}

/**
 * Represents a filtered version of SedeWP for database operations
 */
type SedeWPFiltrado = Partial<{
  despacho_id: string;
  wp_sede_id: number;
  nombre: string;
  descripcion: string;
  web: string;
  telefono: string;
  numero_colegiado: string;
  colegio: string;
  experiencia: string;
  calle: string;
  numero: string;
  piso: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  email_contacto: string;
  persona_contacto: string;
  foto_perfil: string;
  ano_fundacion: number;
  tamano_despacho: string;
  especialidades: string[];
  servicios_especificos: string[];
  estado_verificacion: string;
  latitud: number;
  longitud: number;
  horario: string;
  es_principal: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any additional dynamic properties
}>;

/**
 * Represents a law firm from WordPress
 */
interface DespachoWP {
  id: number;
  title?: { rendered?: string };
  content?: {
    rendered?: string;
    protected?: boolean;
  };
  meta?: {
    _despacho_email_contacto?: string | string[];
    _despacho_telefono?: string | string[];
    _despacho_web?: string | string[];
    _despacho_sedes?: SedeWP[];
    [key: string]: unknown;
  };
  slug?: string;
  status?: string;
  modified?: string;
  modified_gmt?: string;
  [key: string]: unknown;
}

/**
 * Importa un despacho desde WordPress a la base de datos local
 * POST /api/despachos/wordpress/importar
 */
export async function POST(request: Request) {
  console.log("🔄 [WordPress] Iniciando importación de despacho...");

  try {
    const requestData = await request.json();
    const objectId = requestData?.objectId;

    console.log("📥 [WordPress] Datos recibidos:", { objectId });

    if (!objectId) {
      return NextResponse.json(
        {
          error: "Se requiere el objectId del despacho",
          receivedData: requestData,
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = "Falta la configuración de Supabase";
      console.error("❌ [WordPress]", errorMsg, {
        supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json(
        { error: errorMsg },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Obtener el despacho de WordPress
    console.log("🌐 [WordPress] Obteniendo datos del despacho...");
    const wpResponse = await fetch(
      `https://lexhoy.com/wp-json/wp/v2/despacho/${objectId}`
    );

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error(
        "❌ [WordPress] Error al obtener el despacho:",
        wpResponse.status,
        errorText
      );
      return NextResponse.json(
        {
          error: "No se pudo obtener el despacho de WordPress",
          details: errorText,
          status: wpResponse.status,
        },
        { status: 404 }
      );
    }

    const despacho: DespachoWP = await wpResponse.json();
    console.log("✅ [WordPress] Despacho obtenido:", {
      id: despacho.id,
      titulo: despacho.title?.rendered,
      content: despacho.content, // Agregado para depuración
      meta: despacho.meta, // Agregado para depuración
      raw: JSON.stringify(despacho, null, 2) // Agregado para depuración completa
    });

    // Función auxiliar para obtener la descripción de una sede
    interface SedeConDescripcion {
      descripcion?: string | { rendered?: string };
      [key: string]: unknown;
    }
    
    const obtenerDescripcionSede = (sede: SedeConDescripcion): string => {
      // Si la descripción es un string, la devolvemos directamente
      if (typeof sede.descripcion === 'string') {
        return sede.descripcion;
      }
      
      // Si la descripción es un objeto con propiedad 'rendered', la extraemos
      if (sede.descripcion && typeof sede.descripcion === 'object' && sede.descripcion !== null) {
        const desc = sede.descripcion as { rendered?: string };
        if (typeof desc.rendered === 'string') {
          return desc.rendered;
        }
      }
      
      // Si no hay descripción, devolvemos un string vacío
      return '';
    };

    // Generar slug, usando el de WordPress si existe, o generarlo del título
    const generateSlug = (str: string) => {
      if (!str) return '';
      return str
        .toString()
        .toLowerCase()
        .replace(/&/g, "y")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();
    };

    const despachoNombre = despacho.title?.rendered || `Despacho ${despacho.id}`;
    
    // Asegurarse de que siempre tengamos un slug válido
    let slug = '';
    if (despacho.slug && typeof despacho.slug === 'string' && despacho.slug.trim() !== '') {
      slug = generateSlug(despacho.slug);
    } else {
      // Generar slug del título o usar el ID como último recurso
      slug = despachoNombre ? generateSlug(despachoNombre) : `despacho-${despacho.id}`;
    }
    
    // Asegurarse de que el slug no esté vacío
    if (!slug || slug.trim() === '') {
      slug = `despacho-${despacho.id}`;
    }

    // La función obtenerDescripcionSede se usará al procesar las sedes

    // Preparar datos del despacho según la estructura real de la tabla
    // IMPORTANTE: No incluir campos que no existan en la tabla despachos
    // Los siguientes campos pertenecen solo a la tabla sedes y no deben incluirse aquí:
    // - foto_perfil
    // - persona_contacto
    // La descripción solo se usará para las sedes, no para el despacho
    
    // Crear un objeto con solo los campos permitidos para el despacho
    const camposPermitidos = [
      'wordpress_id', 'nombre', 'slug', 'status', 
      'created_at', 'updated_at', 'featured_media_url'
    ];
    
    interface DespachoData {
      wordpress_id: number;
      nombre: string;
      slug: string;
      status: string;
      created_at: string;
      updated_at: string;
      featured_media_url?: string;
    }

    const despachoData: DespachoData = {
      wordpress_id: despacho.id,
      nombre: despachoNombre,
      slug: slug,
      status: despacho.status || 'draft',
      created_at: (typeof despacho.date_gmt === 'string' ? despacho.date_gmt : new Date().toISOString()),
      updated_at: (typeof despacho.modified_gmt === 'string' ? despacho.modified_gmt : new Date().toISOString())
    };
    
    // Definir el tipo DespachoFiltrado sin el campo descripcion
    type DespachoFiltrado = Omit<DespachoData, 'id' | 'featured_media_url'> & {
      featured_media_url?: string;
    };
    
    // Interfaz para el tipo de sede que necesitamos procesar
    interface SedeProcesada {
      id?: number;
      nombre?: string;
      descripcion?: string | { rendered?: string };
      // Agregar otros campos necesarios
      [key: string]: unknown;
    }
    
    // Variable no utilizada intencionalmente
    const _errorBusquedaNombre = '';

    const despachoFiltrado: DespachoFiltrado = {
      wordpress_id: despacho.id,
      nombre: despachoNombre || `Despacho ${despacho.id}`,
      slug: slug || `despacho-${despacho.id}`,
      status: despacho.status || 'draft',
      created_at: (typeof despacho.date_gmt === 'string' ? despacho.date_gmt : new Date().toISOString()),
      updated_at: (typeof despacho.modified_gmt === 'string' ? despacho.modified_gmt : new Date().toISOString())
    };

    // Añadir featured_media_url si está disponible
    if (despacho.featured_media) {
      try {
        const mediaResponse = await fetch(`${WORDPRESS_API_URL}/media/${despacho.featured_media}`);
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          if (mediaData?.source_url) {
            despachoFiltrado.featured_media_url = mediaData.source_url;
          }
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener la imagen destacada:', error);
      }
    }

    console.log('📝 [Debug] Datos finales del despacho a guardar:', {
      ...despachoFiltrado
    });

    console.log('📝 [Debug] Datos del despacho a guardar:', despachoFiltrado);

    // Solo incluir featured_media_url si existe el campo en la tabla
    if (despacho.featured_media) {
      despachoData.featured_media_url = `https://lexhoy.com/wp-content/uploads/${despacho.featured_media}.jpg`;
    }
    
    // Guardar datos adicionales en un campo JSON si es necesario
    const datosAdicionales = {
      areas_practica: despacho.meta?._despacho_sedes?.[0]?.areas_practica || [],
      verificado: despacho.meta?._despacho_sedes?.[0]?.estado_verificacion === 'verificado',
      num_sedes: despacho.meta?._despacho_sedes?.length || 0,
      sincronizado_wp: true,
      ultima_sincronizacion: new Date().toISOString(),
      wordpress_url: despacho.link
    };

    try {
      // Primero verificar si el despacho ya existe
      // Verificar si el despacho ya existe
      const { data: existingDespacho } = await supabase
        .from('despachos')
        .select('*')
        .eq('wordpress_id', despacho.id)
        .single();

      console.log('🔍 [Supabase] Despacho existente:', existingDespacho);

      let result;
      const isNewDespacho = !existingDespacho;
      
      if (existingDespacho) {
        // Actualizar despacho existente
        const updateData = {
          ...despachoFiltrado, // Usar los datos filtrados
          updated_at: new Date().toISOString(),
          // Mantener el estado actual si existe
          status: existingDespacho.status || despachoFiltrado.status || 'draft'
        };
        
        console.log('🔄 [Supabase] Actualizando despacho existente con datos:', updateData);
        
        const { data, error } = await supabase
          .from('despachos')
          .update(updateData)
          .eq('id', existingDespacho.id)
          .select();
        
        if (error) throw error;
        result = { data, error: null };
        console.log('✅ [Supabase] Despacho actualizado:', data);
      } else {
        // Crear nuevo despacho
        const insertData = {
          ...despachoFiltrado, // Usar los datos filtrados
          status: 'publish', // Valor por defecto para nuevos despachos
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('✨ [Supabase] Creando nuevo despacho con datos:', insertData);
        
        const { data, error } = await supabase
          .from('despachos')
          .insert([insertData])
          .select();
        
        if (error) throw error;
        result = { data, error: null };
        console.log('✨ [Supabase] Nuevo despacho creado:', data);
      }

      if (result.error) {
        console.error('❌ [Error] Error al guardar el despacho:', result.error);
        throw result.error;
      }

      // Procesar sedes si existen
      const sedesData = Array.isArray(despacho.meta?._despacho_sedes) ? despacho.meta._despacho_sedes : [];
      let processedCount = 0;
      
      // Usar datosAdicionales en la respuesta
      console.log('📊 [Datos Adicionales]', datosAdicionales);

      if (sedesData.length > 0 && result?.data?.[0]?.id) {
        console.log(
          `🏢 [WordPress] Procesando ${sedesData.length} sedes del despacho...`
        );

        for (const sede of sedesData) {
          try {
            // Preparar datos completos de la sede según la estructura de la tabla 'sedes'
            // Incluyendo todos los campos necesarios
            const sedeData = {
              // Identificación
              despacho_id: result.data[0].id,
              // Solo incluir wp_sede_id si tiene un valor válido
              ...(sede.id ? { wp_sede_id: String(sede.id) } : {}),
              
              // Información básica
              nombre: sede.nombre || `Sede de ${despachoData.namen}`,
              descripcion: sede.descripcion || "",
              // Información de contacto
              web: sede.web || "",
              telefono: sede.telefono || "",
              email_contacto: sede.email_contacto || "",
              persona_contacto: sede.persona_contacto || "",
              
              // Información profesional
              numero_colegiado: sede.numero_colegiado || "",
              colegio: sede.colegio || "",
              experiencia: sede.experiencia || "",
              
              // Ubicación - Campos individuales
              calle: sede.calle || "",
              numero: sede.numero || "",
              piso: sede.piso || "",
              localidad: sede.localidad || "",
              provincia: sede.provincia || "",
              codigo_postal: sede.codigo_postal || "",
              pais: sede.pais || "España",
              
              // Detalles del despacho
              ano_fundacion: sede.ano_fundacion ? parseInt(String(sede.ano_fundacion)) : null,
              tamano_despacho: sede.tamano_despacho || "",
              
              // Servicios y especialidades
              especialidades: typeof sede.especialidades === 'string' ? sede.especialidades : "",
              servicios_especificos: typeof sede.servicios_especificos === 'string' ? sede.servicios_especificos : "",
              areas_practica: Array.isArray(sede.areas_practica) 
                ? sede.areas_practica.map(String).filter(Boolean) 
                : [],
              
              // Multimedia
              foto_perfil: sede.foto_perfil || null,
              
              // Estado
              estado_verificacion: ['verificado', 'pendiente', 'rechazado'].includes(String(sede.estado_verificacion)) 
                ? String(sede.estado_verificacion)
                : "pendiente",
              estado_registro: ['activo', 'inactivo', 'pendiente'].includes(String(sede.estado_registro))
                ? String(sede.estado_registro)
                : "activo",
              is_verified: Boolean(sede.is_verified),
              es_principal: Boolean(sede.es_principal),
              activa: sede.activa !== false, // Por defecto true si no está definido o es true
              
              // Datos estructurados
              horarios: sede.horarios && typeof sede.horarios === 'object' ? sede.horarios : {},
              redes_sociales: sede.redes_sociales && typeof sede.redes_sociales === 'object' 
                ? sede.redes_sociales 
                : {},
              direccion: {
                calle: String(sede.calle || ""),
                numero: String(sede.numero || ""),
                piso: String(sede.piso || ""),
                codigo_postal: String(sede.codigo_postal || ""),
                localidad: String(sede.localidad || ""),
                provincia: String(sede.provincia || ""),
                pais: String(sede.pais || "España")
              },
              
              // Observaciones
              observaciones: String(sede.observaciones || ''),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // 1. Primero intentamos encontrar la sede por wp_sede_id si existe un ID válido
            if (sede.id) {
              try {
                const { data: sedeExistente } = await supabase
                  .from("sedes")
                  .select("*")
                  .eq("wp_sede_id", String(sede.id))
                  .maybeSingle();

                if (sedeExistente) {
                  // Si encontramos por wp_sede_id, actualizamos
                  const { error: updateError } = await supabase
                    .from("sedes")
                    .update(sedeData)
                    .eq("id", sedeExistente.id);

                  if (updateError) throw updateError;
                  console.log(`🔄 [Sede] Actualizada por wp_sede_id: ${sedeData.nombre}`, { id: sedeExistente.id });
                  processedCount++;
                  continue; // Pasamos a la siguiente sede
                }
              } catch (error) {
                console.warn(`⚠️ [Advertencia] Error al buscar por wp_sede_id:`, error);
                // Continuamos con la siguiente estrategia de búsqueda
              }
            }

            // 2. Si no la encontramos por wp_sede_id, buscamos por nombre y despacho_id
            const { data: sedePorNombre, error: errorBusquedaNombre } = await supabase
              .from('sedes')
              .select('*')
              .eq('nombre', sedeData.nombre)
              .eq('despacho_id', sedeData.despacho_id)
              .maybeSingle();

            if (sedePorNombre) {
              // Usamos el objeto completo de sedeData para la actualización
              // para asegurar que todos los campos se actualicen correctamente
              const datosActualizacion = { ...sedeData };
              
              // Aseguramos que el ID no se actualice
              delete datosActualizacion.id;
              delete datosActualizacion.created_at; // No actualizar la fecha de creación
              
              // Si encontramos por nombre y despacho_id, actualizamos con todos los campos
              console.log('🔄 [Debug] Actualizando sede existente con datos:', JSON.stringify(sedeData, null, 2));
              
              // Actualizamos con todos los campos de sedeData
              const { error: updateError } = await supabase
                .from('sedes')
                .update(sedeData)
                .eq('id', sedePorNombre.id);

              if (updateError) throw updateError;
              console.log(`🔄 [Sede] Actualizada por nombre: ${sedeData.nombre}`, { id: sedePorNombre.id });
              processedCount++;
              continue; // Pasamos a la siguiente sede
            }

            // 3. Si no existe, la creamos con todos los campos necesarios
            // Usamos el objeto completo de sedeData que ya tiene todos los campos mapeados correctamente
            console.log('📝 [Debug] Insertando nueva sede con datos:', JSON.stringify(sedeData, null, 2));
            
            const { data: nuevaSede, error: insertError } = await supabase
              .from('sedes')
              .insert(sedeData)
              .select()
              .single();

            if (insertError) {
              console.error('❌ [Error] Detalles del error al insertar sede:', {
                error: insertError,
                sedeData: sedeData,
                wp_sede_id: sedeData.wp_sede_id
              });
              throw insertError;
            }

            console.log(`✨ [Sede] Creada: ${sedeData.nombre}`, { id: nuevaSede?.id });
            processedCount++;
          } catch (error) {
            console.error(`❌ [Error] Error al procesar sede ${sede.nombre || 'sin nombre'}:`, error);
          }
        }
      }

      console.log(
        `✅ [Sedes] Procesamiento completado: ${processedCount} de ${sedesData.length} sedes procesadas correctamente`
      );

      return NextResponse.json({
        success: true,
        message: "Despacho importado correctamente",
        data: result.data[0],
        isNew: isNewDespacho,
        sedesProcesadas: processedCount,
        totalSedes: sedesData.length
      });
    } catch (error) {
      console.error("❌ [Error] Error en la importación:", error);
      return NextResponse.json(
        {
          error: "Error al importar el despacho",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ [Error] Error en la solicitud:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
