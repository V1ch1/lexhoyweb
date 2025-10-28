import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

interface Sede {
  id?: number;
  nombre?: string;
  // ... resto de la interfaz Sede ...
}

interface DespachoSede
  extends Omit<Sede, "id" | "redes_sociales" | "horarios"> {
  wp_sede_id?: number;
  despacho_id: string;
  created_at: string;
  updated_at: string;
  estado: "activo" | "inactivo";
  redes_sociales: string;
  horarios: string;
}

interface DespachoWP {
  id: number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: {
    _despacho_email_contacto?: string | string[];
    _despacho_telefono?: string | string[];
    _despacho_web?: string | string[];
    _despacho_sedes?: Array<{
      id?: number;
      nombre?: string;
      calle?: string;
      localidad?: string;
      provincia?: string;
      codigo_postal?: string;
      telefono?: string;
      email_contacto?: string;
      // ... resto de los campos de la sede ...
    }>;
    [key: string]: unknown;
  };
  slug?: string;
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
        .replace(/&/g, 'y') // Reemplaza & por 'y'
        .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
        .replace(/\s+/g, '-') // Reemplaza espacios por guiones
        .replace(/--+/g, '-') // Reemplaza múltiples guiones por uno solo
        .trim();
    };

    const despachoNombre = despacho.title?.rendered || `Despacho ${despacho.id}`;
    
    // Preparar datos del despacho
    const despachoData = {
      wordpress_id: despacho.id,
      nombre: despachoNombre,
      slug: generateSlug(despachoNombre), // Añadir el slug generado
      descripcion: despacho.content?.rendered || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'activo',
    };

    try {
      // Verificar si el despacho ya existe
      const { data: existingDespacho, error: fetchError } = await supabase
        .from('despachos')
        .select('*')
        .eq('wordpress_id', despacho.id)
        .single();

      let resultado;
      
      // Insertar o actualizar el despacho
      if (existingDespacho) {
        console.log('🔄 [Supabase] Actualizando despacho existente:', existingDespacho.id);
        const { data, error } = await supabase
          .from('despachos')
          .update(despachoData)
          .eq('id', existingDespacho.id)
          .select()
          .single();
          
        if (error) throw error;
        resultado = { ...data, isNew: false };
      } else {
        console.log('✨ [Supabase] Creando nuevo despacho');
        const { data, error } = await supabase
          .from('despachos')
          .insert([despachoData])
          .select()
          .single();
          
        if (error) throw error;
        resultado = { ...data, isNew: true };
      }

      console.log('✅ [Supabase] Despacho guardado correctamente');

      // Procesar sedes si existen
      const sedesData = despacho.meta?._despacho_sedes || [];
      let processedCount = 0;

      if (sedesData.length > 0) {
        console.log(`🏢 [WordPress] Procesando ${sedesData.length} sedes del despacho...`);

        for (const sede of sedesData) {
          try {
            const sedeData = {
              nombre: sede.nombre || `Sede de ${despachoData.nombre}`,
              direccion: sede.calle || '',
              localidad: sede.localidad || '',
              provincia: sede.provincia || '',
              codigo_postal: sede.codigo_postal || '',
              telefono: sede.telefono || '',
              email_contacto: sede.email_contacto || '',
              despacho_id: resultado.id,
              wp_sede_id: sede.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              activa: true,
            };

            // Verificar si la sede ya existe
            const { data: existingSede } = await supabase
              .from('sedes')
              .select('*')
              .eq('wp_sede_id', sede.id)
              .single();

            if (existingSede) {
              // Actualizar sede existente
              const { error: updateError } = await supabase
                .from('sedes')
                .update(sedeData)
                .eq('id', existingSede.id);
                
              if (updateError) throw updateError;
              console.log(`✅ [Supabase] Sede actualizada: ${sedeData.nombre}`);
            } else {
              // Insertar nueva sede
              const { error: insertError } = await supabase
                .from('sedes')
                .insert([sedeData]);
                
              if (insertError) throw insertError;
              console.log(`✅ [Supabase] Nueva sede creada: ${sedeData.nombre}`);
            }
            
            processedCount++;
          } catch (error) {
            console.error(`❌ [Error] Error al procesar sede:`, error);
          }
        }
      }

      console.log(`✅ [Sedes] Procesamiento completado: ${processedCount} de ${sedesData.length} sedes procesadas correctamente`);

      return NextResponse.json({
        success: true,
        message: 'Despacho importado correctamente',
        data: resultado,
        isNew: !!resultado.isNew,
        sedesProcesadas: sedesData.length
      });
    } catch (error) {
      console.error('❌ [Error] Error en la importación:', error);
      return NextResponse.json(
        { 
          error: 'Error al importar el despacho',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Error] Error en la solicitud:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
