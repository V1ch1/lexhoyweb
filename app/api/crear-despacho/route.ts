import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SyncService } from "@/lib/syncService";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para crear un nuevo despacho
 * Crea en Next.js y envía a WordPress
 */
export async function POST(request: Request) {
  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar usuario
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del body
    const body = await request.json();
    const {
      nombre,
      descripcion,
      areas_practica,
      localidad,
      provincia,
      direccion,
      telefono,
      email,
      web,
    } = body;

    // Validar campos requeridos
    if (!nombre || !descripcion || !localidad || !provincia) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nombre, descripción, localidad, provincia" },
        { status: 400 }
      );
    }

    console.log('📝 Creando nuevo despacho:', nombre);

    // Generar slug único
    const baseSlug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, "") // Eliminar caracteres especiales
      .replace(/\s+/g, "-") // Espacios a guiones
      .replace(/-+/g, "-") // Múltiples guiones a uno
      .trim();

    // Verificar si el slug ya existe
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data: existing } = await supabase
        .from('despachos')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Crear despacho en Next.js
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .insert({
        nombre,
        descripcion,
        slug,
        areas_practica: areas_practica || [],
        activo: false, // Inactivo hasta que se apruebe la solicitud
        verificado: false,
        sincronizado_wp: false, // Aún no enviado a WordPress
        num_sedes: 1,
      })
      .select('id')
      .single();

    if (despachoError) {
      console.error('Error al crear despacho:', despachoError);
      throw despachoError;
    }

    console.log('✅ Despacho creado en Next.js:', despacho.id);

    // Crear sede principal
    const { error: sedeError } = await supabase
      .from('sedes')
      .insert({
        despacho_id: despacho.id,
        nombre: 'Sede Principal',
        es_principal: true,
        localidad,
        provincia,
        calle: direccion || '',
        telefono: telefono || '',
        email: email || '',
        web: web || '',
        activa: true,
        sincronizado_wp: false,
        estado_verificacion: 'pendiente',
      });

    if (sedeError) {
      console.error('Error al crear sede:', sedeError);
      // No lanzamos error, el despacho ya está creado
    } else {
      console.log('✅ Sede principal creada');
    }

    // Intentar enviar a WordPress
    console.log('🔄 Enviando despacho a WordPress...');
    const wpResult = await SyncService.enviarDespachoAWordPress(despacho.id);

    if (wpResult.success) {
      console.log('✅ Despacho enviado a WordPress:', wpResult.objectId);
    } else {
      console.warn('⚠️ No se pudo enviar a WordPress:', wpResult.error);
      console.warn('El despacho se sincronizará más tarde');
    }

    return NextResponse.json({
      success: true,
      message: 'Despacho creado correctamente',
      despachoId: despacho.id,
      objectId: wpResult.objectId,
      sincronizadoWP: wpResult.success,
    });

  } catch (error) {
    console.error('Error al crear despacho:', error);
    return NextResponse.json(
      {
        error: 'Error al crear despacho',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
