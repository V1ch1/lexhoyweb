import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { unserialize as phpUnserialize } from "php-serialize";

const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL || "https://despachos.lexhoy.com/wp-json/wp/v2";

/**
 * Deserializa un string serializado de PHP a objeto JavaScript
 * Usa la librería php-serialize para manejar correctamente el formato
 */
function unserialize(data: string | unknown): unknown {
  if (!data) return null;
  
  // Si ya es un objeto o array, devolverlo
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return data;
  
  if (typeof data !== 'string') return null;

  try {
    const result = phpUnserialize(data);
    
    // Convertir objetos con claves numéricas a arrays
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const keys = Object.keys(result);
      const isNumericArray = keys.every((k, i) => k === String(i));
      if (isNumericArray) {
        return Object.values(result);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error deserializando PHP:', error, 'Data:', data.substring(0, 200));
    return null;
  }
}

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

// SedeWPFiltrado type has been removed as it was not being used

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
  try {
    const requestData = await request.json();
    const objectId = requestData?.objectId;

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
    // La función obtenerDescripcionSede ha sido eliminada ya que no se estaba utilizando

    // Función para decodificar entidades HTML
    const decodeHtmlEntities = (str: string): string => {
      if (!str) return "";
      return str
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    };

    // Generar slug, usando el de WordPress si existe, o generarlo del título
    const generateSlug = (str: string) => {
      if (!str) return "";
      // Primero decodificar entidades HTML
      const decoded = decodeHtmlEntities(str);
      return decoded
        .toString()
        .toLowerCase()
        .replace(/&/g, "y")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();
    };

    const despachoNombre = decodeHtmlEntities(
      despacho.title?.rendered || `Despacho ${despacho.id}`
    );

    // Asegurarse de que siempre tengamos un slug válido
    let slug = "";
    if (
      despacho.slug &&
      typeof despacho.slug === "string" &&
      despacho.slug.trim() !== ""
    ) {
      slug = generateSlug(despacho.slug);
    } else {
      // Generar slug del título o usar el ID como último recurso
      slug = despachoNombre
        ? generateSlug(despachoNombre)
        : `despacho-${despacho.id}`;
    }

    // Asegurarse de que el slug no esté vacío
    if (!slug || slug.trim() === "") {
      slug = `despacho-${despacho.id}`;
    }

    // Preparar datos del despacho según la estructura real de la tabla
    // IMPORTANTE: No incluir campos que no existan en la tabla despachos
    // Los siguientes campos pertenecen solo a la tabla sedes y no deben incluirse aquí:
    // - foto_perfil
    // - persona_contacto
    // La descripción solo se usará para las sedes, no para el despacho

    // Se eliminó la constante camposPermitidos ya que no se estaba utilizando

    // Preparar datos del despacho según la estructura REAL de Supabase
    // Campos verificados: id, slug, nombre, created_at, updated_at, wordpress_id,
    // featured_media_url, status, num_sedes, owner_email, object_id,
    // sincronizado_wp, ultima_sincronizacion, estado_publicacion, estado_verificacion
    //
    // Mapeo de campos WordPress -> Supabase:
    // - _despacho_estado_verificacion -> estado_verificacion ("verificado" | "pendiente")
    // - _despacho_is_verified -> estado_verificacion (1/0 -> "verificado"/"pendiente")
    // - _despacho_estado_registro -> status ("activo" -> "active", otros -> "inactive")
    interface DespachoData {
      wordpress_id: number;
      object_id: string;
      nombre: string;
      slug: string;
      sincronizado_wp: boolean;
      ultima_sincronizacion: string;
      estado_publicacion: string;
      estado_verificacion: string; // "verificado" | "pendiente" | "rechazado"
      status: string; // "active" | "inactive"
      created_at?: string;
      updated_at?: string;
    }

    // Obtener el estado de verificación y registro desde WordPress
    const estadoVerificacionWP = despacho.meta?._despacho_estado_verificacion;
    const isVerifiedWP = despacho.meta?._despacho_is_verified;
    const estadoRegistroWP = despacho.meta?._despacho_estado_registro;
    
    let estadoVerificacion = "pendiente";
    if (Array.isArray(estadoVerificacionWP) && estadoVerificacionWP[0]) {
      estadoVerificacion = estadoVerificacionWP[0] === "verificado" ? "verificado" : "pendiente";
    } else if (Array.isArray(isVerifiedWP) && (isVerifiedWP[0] === 1 || isVerifiedWP[0] === "1" || isVerifiedWP[0] === true)) {
      estadoVerificacion = "verificado";
    }
    
    let estadoRegistro = "activo";
    if (Array.isArray(estadoRegistroWP) && estadoRegistroWP[0]) {
      estadoRegistro = estadoRegistroWP[0];
    }

    const despachoFiltrado: DespachoData = {
      wordpress_id: despacho.id,
      object_id: String(despacho.id),
      nombre: despachoNombre || `Despacho ${despacho.id}`, // Ya está decodificado arriba
      slug: slug || `despacho-${despacho.id}`,
      sincronizado_wp: true,
      ultima_sincronizacion: new Date().toISOString(),
      estado_publicacion: despacho.status || "publish",
      estado_verificacion: estadoVerificacion,
      status: estadoRegistro === "activo" ? "active" : "inactive",
      created_at:
        typeof despacho.date_gmt === "string"
          ? despacho.date_gmt
          : new Date().toISOString(),
      updated_at:
        typeof despacho.modified_gmt === "string"
          ? despacho.modified_gmt
          : new Date().toISOString(),
    };

    try {
      // Verificar si el despacho ya existe por object_id
      const { data: existingDespacho } = await supabase
        .from("despachos")
        .select("*")
        .eq("object_id", String(despacho.id))
        .single();

      let result;
      const isNewDespacho = !existingDespacho;

      if (existingDespacho) {
        // Actualizar despacho existente
        const updateData = {
          nombre: despachoFiltrado.nombre,
          slug: despachoFiltrado.slug,
          sincronizado_wp: true,
          ultima_sincronizacion: new Date().toISOString(),
          estado_publicacion: despachoFiltrado.estado_publicacion,
          status: despachoFiltrado.status,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("despachos")
          .update(updateData)
          .eq("id", existingDespacho.id)
          .select();

        if (error) throw error;
        result = { data, error: null };
      } else {
        // Crear nuevo despacho
        const { data, error } = await supabase
          .from("despachos")
          .insert([despachoFiltrado])
          .select();

        if (error) throw error;
        result = { data, error: null };
      }

      if (result.error) {
        console.error("❌ [Error] Error al guardar el despacho:", result.error);
        throw result.error;
      }

      // Procesar sedes si existen
      // WordPress devuelve _despacho_sedes como array de strings serializados de PHP
      let sedesData: SedeWP[] = [];
      const sedesMeta = despacho.meta?._despacho_sedes;
      
      if (sedesMeta) {
        if (Array.isArray(sedesMeta) && sedesMeta.length > 0) {
          // Si viene como array de strings, deserializar el primer elemento
          const sedesRaw = typeof sedesMeta[0] === 'string' 
            ? unserialize(sedesMeta[0])
            : sedesMeta[0];
          
          if (Array.isArray(sedesRaw)) {
            sedesData = sedesRaw as SedeWP[];
          } else if (sedesRaw && typeof sedesRaw === 'object') {
            // Si es un objeto, convertirlo a array
            sedesData = Object.values(sedesRaw) as SedeWP[];
          }
        } else if (typeof sedesMeta === 'string') {
          // Si viene como string serializado directamente
          const sedesRaw = unserialize(sedesMeta);
          
          if (Array.isArray(sedesRaw)) {
            sedesData = sedesRaw as SedeWP[];
          } else if (sedesRaw && typeof sedesRaw === 'object') {
            sedesData = Object.values(sedesRaw) as SedeWP[];
          }
        }
      }
      
      console.log(`📍 Importando despacho "${despachoFiltrado.nombre}" con ${sedesData.length} sede(s)`);
      let processedCount = 0;

      if (sedesData.length > 0 && result?.data?.[0]?.id) {
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
              nombre: sede.nombre || `Sede de ${despachoFiltrado.nombre}`,
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
              ano_fundacion: sede.ano_fundacion
                ? parseInt(String(sede.ano_fundacion))
                : null,
              tamano_despacho: sede.tamano_despacho || "",

              // Servicios y especialidades
              especialidades:
                typeof sede.especialidades === "string"
                  ? sede.especialidades
                  : "",
              servicios_especificos:
                typeof sede.servicios_especificos === "string"
                  ? sede.servicios_especificos
                  : "",
              areas_practica: Array.isArray(sede.areas_practica)
                ? sede.areas_practica.map(String).filter(Boolean)
                : [],

              // Multimedia
              foto_perfil: sede.foto_perfil || null,

              // Estado
              estado_verificacion: [
                "verificado",
                "pendiente",
                "rechazado",
              ].includes(String(sede.estado_verificacion))
                ? String(sede.estado_verificacion)
                : "pendiente",
              estado_registro: ["activo", "inactivo", "pendiente"].includes(
                String(sede.estado_registro)
              )
                ? String(sede.estado_registro)
                : "activo",
              is_verified: Boolean(sede.is_verified),
              es_principal: Boolean(sede.es_principal),
              activa: sede.activa !== false, // Por defecto true si no está definido o es true

              // Datos estructurados
              horarios:
                sede.horarios && typeof sede.horarios === "object"
                  ? sede.horarios
                  : {},
              redes_sociales:
                sede.redes_sociales && typeof sede.redes_sociales === "object"
                  ? sede.redes_sociales
                  : {},

              // Observaciones
              observaciones: String(sede.observaciones || ""),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // 1. Primero intentamos encontrar la sede por wp_sede_id si existe un ID válido
            const sedeId =
              sede && typeof sede === "object" && "id" in sede
                ? String(sede.id)
                : null;
            if (sedeId) {
              const { data: existingSede } = await supabase
                .from("sedes")
                .select("*")
                .eq("wp_sede_id", sedeId)
                .maybeSingle();

              if (existingSede) {
                // Si encontramos por wp_sede_id, actualizamos
                // Extraemos solo los campos que necesitamos, ignorando id y created_at
                const { id, created_at, ...datosActualizacion } =
                  sedeData as Record<string, unknown>;
                // Indicamos que estas variables son intencionalmente no utilizadas
                void (id && created_at && 0);

                // Crear un nuevo objeto sin los campos vacíos o nulos
                const cleanSedeData: Record<string, unknown> = {};
                Object.entries(datosActualizacion).forEach(([key, value]) => {
                  if (value !== null && value !== "") {
                    cleanSedeData[key] = value;
                  }
                });

                // Si encontramos por nombre y despacho_id, actualizamos con todos los campos
                const { error: updateError } = await supabase
                  .from("sedes")
                  .update(cleanSedeData)
                  .eq("id", existingSede.id);

                if (updateError) throw updateError;
                processedCount++;
                continue; // Pasamos a la siguiente sede
              }
            }

            // 2. Si no la encontramos por wp_sede_id, buscamos por nombre y despacho_id
            const { data: sedePorNombre } = await supabase
              .from("sedes")
              .select("*")
              .eq("nombre", sedeData.nombre)
              .eq("despacho_id", sedeData.despacho_id)
              .maybeSingle();

            if (sedePorNombre) {
              // Extraemos solo los campos que necesitamos, ignorando id y created_at
              const { id, created_at, ...datosActualizacion } =
                sedeData as Record<string, unknown>;
              // Indicamos que estas variables son intencionalmente no utilizadas
              void (id && created_at && 0);

              // Crear un nuevo objeto sin los campos vacíos o nulos
              const cleanSedeData: Record<string, unknown> = {};
              Object.entries(datosActualizacion).forEach(([key, value]) => {
                if (value !== null && value !== "") {
                  cleanSedeData[key] = value;
                }
              });

              // Si encontramos por nombre y despacho_id, actualizamos con todos los campos
              const { error: updateError } = await supabase
                .from("sedes")
                .update(cleanSedeData)
                .eq("id", sedePorNombre.id);

              if (updateError) throw updateError;
              processedCount++;
              continue; // Pasamos a la siguiente sede
            }

            // 3. Si no existe, la creamos con todos los campos necesarios
            // Usamos el objeto completo de sedeData que ya tiene todos los campos mapeados correctamente
            const { error: insertError } = await supabase
              .from('sedes')
              .insert(sedeData)
              .select()
              .single();

            if (insertError) {
              console.error("❌ [Error] Detalles del error al insertar sede:", {
                error: insertError,
                sedeData: sedeData,
                wp_sede_id: sedeData.wp_sede_id,
              });
              throw insertError;
            }

            processedCount++;
          } catch (error) {
            console.error(
              `❌ [Error] Error al procesar sede ${sede.nombre || "sin nombre"}:`,
              error
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Despacho importado correctamente",
        data: result.data[0],
        isNew: isNewDespacho,
        sedesProcesadas: processedCount,
        totalSedes: sedesData.length,
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
