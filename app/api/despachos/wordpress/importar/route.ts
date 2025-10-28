import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
    });

    // Generar slug a partir del nombre
    const generateSlug = (str: string) => {
      return str
        .toString()
        .toLowerCase()
        .replace(/&/g, "y") // Reemplaza & por 'y'
        .replace(/[^\w\s-]/g, "") // Elimina caracteres especiales
        .replace(/\s+/g, "-") // Reemplaza espacios por guiones
        .replace(/--+/g, "-") // Reemplaza múltiples guiones por uno solo
        .trim();
    };

    const despachoNombre =
      despacho.title?.rendered || `Despacho ${despacho.id}`;

    // Preparar datos del despacho según la estructura real de la tabla
    const despachoData = {
      wordpress_id: despacho.id,
      nombre: despachoNombre,
      descripcion: despacho.content?.rendered || "",
      slug: generateSlug(despachoNombre),
      status: despacho.status || 'draft',
      featured_media_url: despacho.featured_media 
        ? `https://lexhoy.com/wp-content/uploads/${despacho.featured_media}.jpg` 
        : null,
      created_at: despacho.date_gmt || new Date().toISOString(),
      updated_at: despacho.modified_gmt || new Date().toISOString()
    };
    
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
          ...despachoData,
          updated_at: new Date().toISOString(),
          // Mantener el estado actual si existe
          status: existingDespacho.status || despachoData.status || 'draft'
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
          ...despachoData,
          status: 'publish', // Valor por defecto para nuevos despachos
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Incluir datos adicionales como JSON en un campo existente, por ejemplo en 'descripcion_extra'
          // o crear un campo JSON en tu tabla para estos datos
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
            // Preparar datos de la sede
            const sedeData = {
              nombre: sede.nombre || `Sede de ${despachoData.nombre}`,
              descripcion: sede.descripcion || "",
              web: sede.web || "",
              telefono: sede.telefono || "",
              numero_colegiado: sede.numero_colegiado || "",
              colegio: sede.colegio || "",
              experiencia: sede.experiencia || "",
              direccion: `${sede.calle || ''} ${sede.numero || ''}`.trim(),
              calle: sede.calle || "",
              numero: sede.numero || "",
              piso: sede.piso || "",
              localidad: sede.localidad || "",
              provincia: sede.provincia || "",
              codigo_postal: sede.codigo_postal || "",
              pais: sede.pais || "España",
              persona_contacto: sede.persona_contacto || "",
              email_contacto: sede.email_contacto || "",
              ano_fundacion: sede.ano_fundacion ? parseInt(String(sede.ano_fundacion)) : null,
              tamano_despacho: sede.tamano_despacho || "",
              especialidades: sede.especialidades || "",
              servicios_especificos: sede.servicios_especificos || "",
              estado_verificacion: sede.estado_verificacion || "pendiente",
              estado_registro: sede.estado_registro || "activo",
              is_verified: sede.is_verified || false,
              observaciones: sede.observaciones || "",
              es_principal: sede.es_principal || false,
              activa: sede.activa !== undefined ? sede.activa : true,
              foto_perfil: sede.foto_perfil || null,
              horarios: sede.horarios ? JSON.stringify(sede.horarios) : '{}',
              redes_sociales: sede.redes_sociales ? JSON.stringify(sede.redes_sociales) : '{}',
              areas_practica: Array.isArray(sede.areas_practica) ? sede.areas_practica : [],
              despacho_id: result.data[0].id,
              wp_sede_id: sede.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Verificar si la sede ya existe
            const { data: existingSede } = await supabase
              .from("sedes")
              .select("*")
              .eq("wp_sede_id", sede.id)
              .single();

            if (existingSede) {
              // Actualizar sede existente
              const { error: updateError } = await supabase
                .from("sedes")
                .update(sedeData)
                .eq("id", existingSede.id);

              if (updateError) throw updateError;
              console.log(`🔄 [Sede] Actualizada: ${sedeData.nombre}`);
            } else {
              // Crear nueva sede
              const { error: insertError } = await supabase
                .from("sedes")
                .insert([sedeData]);

              if (insertError) throw insertError;
              console.log(`✨ [Sede] Creada: ${sedeData.nombre}`);
            }

            processedCount++;
          } catch (error) {
            console.error(`❌ [Error] Error al procesar sede:`, error);
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
