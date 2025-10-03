import { NextResponse } from "next/server";

// Endpoint de prueba simplificado
export async function POST(request: Request) {
  try {
    // 1. Obtener información básica
    const url = new URL(request.url);
    console.log('\n===== NUEVA SOLICITUD =====');
    console.log(`URL: ${url}`);
    console.log(`Método: ${request.method}`);
    
    // 2. Mostrar headers
    console.log('\nHEADERS:');
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    
    // 3. Obtener el cuerpo
    const body = await request.text();
    console.log('\nCUERPO DE LA SOLICITUD:');
    console.log(body || '(vacío)');
    
    // 4. Devolver una respuesta simple
    return NextResponse.json(
      { 
        status: 'success',
        message: 'Solicitud recibida',
        body: body || null,
        headers: Object.fromEntries(request.headers.entries())
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
      postMeta = body.post_meta || {};
      console.log('ℹ️ Formato detectado: WP Webhooks');
    } else if (body.meta) {
      // Formato directo con meta
      postData = body;
      postMeta = body.meta || {};
      console.log('ℹ️ Formato detectado: JSON con meta');
    } else {
      // Formato plano
      postData = body;
      postMeta = {};
      console.log('ℹ️ Formato detectado: JSON plano');
    }
    
    console.log('📝 Datos extraídos:', {
      postData: Object.keys(postData),
      postMeta: Object.keys(postMeta)
    });

    // Validar datos requeridos
    console.log('🔍 Validando datos requeridos...');
    
    const objectId = postData.ID || postData.id || postData.objectId;
    if (!objectId) {
      console.error('❌ Falta el ID del post en el payload');
      console.error('📋 Payload recibido:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { 
          error: "No se pudo identificar el post",
          details: "Falta el campo ID, id u objectId en el payload",
          receivedPayload: body
        }, 
        { status: 400 }
      );
    }
    
    console.log('✅ Datos válidos, ID del post:', objectId);

    // Mapear campos de WordPress a nuestro formato
    console.log('🔄 Mapeando campos...');
    
    const nombre = postData.post_title || postData.nombre || postData.title?.rendered || '';
    const descripcion = postData.post_excerpt || postData.descripcion || postData.excerpt?.rendered || '';
    const slug = postData.post_name || postData.slug || '';
    
    // Manejar diferentes formatos de meta
    let localidad = '';
    let provincia = '';
    let areas_practica = [];
    
    // Intentar extraer de diferentes formatos
    if (postMeta.localidad) {
      localidad = Array.isArray(postMeta.localidad) ? postMeta.localidad[0] : postMeta.localidad;
    } else if (postMeta.meta?.localidad) {
      localidad = postMeta.meta.localidad;
    }
    
    if (postMeta.provincia) {
      provincia = Array.isArray(postMeta.provincia) ? postMeta.provincia[0] : postMeta.provincia;
    } else if (postMeta.meta?.provincia) {
      provincia = postMeta.meta.provincia;
    }
    
    if (postMeta.areas_practica) {
      areas_practica = Array.isArray(postMeta.areas_practica) 
        ? postMeta.areas_practica 
        : [postMeta.areas_practica];
    } else if (postMeta.meta?.areas_practica) {
      areas_practica = Array.isArray(postMeta.meta.areas_practica)
        ? postMeta.meta.areas_practica
        : [postMeta.meta.areas_practica];
    }
    
    const num_sedes = postMeta.num_sedes?.[0] || postMeta.num_sedes || 1;
    
    console.log('📋 Campos mapeados:', {
      objectId,
      nombre,
      descripcion,
      slug,
      localidad,
      provincia,
      areas_practica,
      num_sedes
    });

    // 3. Consultar WordPress para obtener los datos completos del despacho
    console.log('🔍 Consultando WordPress...');
    const username = process.env.NEXT_PUBLIC_WP_USER;
    const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
    
    if (!username || !appPassword) {
      console.error('❌ Falta configuración de autenticación de WordPress');
      return NextResponse.json(
        { error: "Error de configuración del servidor" }, 
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    let despachoWP = null;

    // Si el objectId es numérico, usar el endpoint directo por ID
    if (/^\d+$/.test(objectId)) {
      const wpRes = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho/${objectId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (wpRes.ok) {
        despachoWP = await wpRes.json();
      }
    } else {
      // Si no es numérico, buscar por object_id y filtrar
      const wpRes = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho?object_id=${objectId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (wpRes.ok) {
        const wpData = await wpRes.json();
        if (wpData && wpData.length) {
          despachoWP = wpData.find(
            (d: any) => d.id?.toString() === objectId || d.meta?.object_id === objectId
          ) || wpData[0];
        }
      }
    }

    // Si no se encuentra en WordPress, usar los datos del body
    if (!despachoWP) {
      console.log('ℹ️ No se encontró el despacho en WordPress, usando datos del payload');
      despachoWP = {
        meta: {
          object_id: objectId,
          _despacho_sedes: [],
          areas_practica: areas_practica || [],
        },
        title: { rendered: nombre || "" },
        excerpt: { rendered: descripcion || "" },
        slug: slug || (nombre ? nombre.toLowerCase().replace(/ /g, "-") : ""),
        date: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      if (localidad || provincia) {
        despachoWP.meta._despacho_sedes.push({ localidad, provincia });
      }
    }

    // 4. Transformar los datos al esquema de Supabase
    const despachoSupabase = {
      object_id: despachoWP.meta?.object_id || objectId,
      nombre: despachoWP.title?.rendered || "",
      descripcion: despachoWP.excerpt?.rendered || "",
      num_sedes: Array.isArray(despachoWP.meta?._despacho_sedes)
        ? despachoWP.meta._despacho_sedes.length
        : 0,
      areas_practica: despachoWP.meta?.areas_practica || [],
      ultima_actualizacion: despachoWP.modified || new Date().toISOString(),
      slug: despachoWP.slug || "",
      fecha_creacion: despachoWP.date
        ? new Date(despachoWP.date).toISOString()
        : new Date().toISOString(),
      fecha_actualizacion: despachoWP.modified
        ? new Date(despachoWP.modified).toISOString()
        : new Date().toISOString(),
      verificado: despachoWP.meta?.verificado ?? false,
      activo: despachoWP.meta?.activo ?? true,
    };

    // 5. Guardar o actualizar el despacho en Supabase
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar si ya existe un despacho con este object_id
    const { data: existing } = await supabase
      .from("despachos")
      .select("id")
      .eq("object_id", despachoSupabase.object_id)
      .single();

    let despachoId: string;
    
    if (existing) {
      // Actualizar despacho existente
      const { error: updateError } = await supabase
        .from("despachos")
        .update(despachoSupabase)
        .eq("object_id", despachoSupabase.object_id);

      if (updateError) {
        throw new Error(`Error al actualizar en Supabase: ${updateError.message}`);
      }
      despachoId = existing.id;
      console.log(`✅ Despacho ${despachoId} actualizado en Supabase`);
    } else {
      // Crear nuevo despacho
      const { data: insertData, error: insertError } = await supabase
        .from("despachos")
        .insert(despachoSupabase)
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Error al insertar en Supabase: ${insertError.message}`);
      }
      despachoId = insertData.id;
      console.log(`✅ Nuevo despacho ${despachoId} creado en Supabase`);
    }

    // 6. Sincronizar sedes
    if (Array.isArray(despachoWP.meta?._despacho_sedes)) {
      // Eliminar sedes antiguas
      await supabase.from("sedes").delete().eq("despacho_id", despachoId);
      
      // Insertar nuevas sedes
      const sedesToInsert = despachoWP.meta._despacho_sedes.map((sede: any, idx: number) => ({
        despacho_id: despachoId,
        nombre: sede.nombre || `Sede ${idx + 1}`,
        descripcion: sede.descripcion || "",
        web: sede.web || "",
        localidad: sede.localidad || "",
        provincia: sede.provincia || "",
        codigo_postal: sede.codigo_postal || "",
        pais: sede.pais || "España",
        telefono: sede.telefono || "",
        email_contacto: sede.email_contacto || "",
        es_principal: idx === 0,
        activa: true,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
      }));

      if (sedesToInsert.length > 0) {
        const { error: sedesError } = await supabase
          .from("sedes")
          .insert(sedesToInsert);

        if (sedesError) {
          throw new Error(`Error al guardar sedes: ${sedesError.message}`);
        }
        console.log(`✅ ${sedesToInsert.length} sedes sincronizadas`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Despacho sincronizado correctamente',
      despachoId: despachoId
    });

  } catch (error: any) {
    console.error('❌ Error en el webhook:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  } finally {
    console.log('🔍 ===== FIN DE SOLICITUD DE WEBHOOK =====\n');
  }
}
