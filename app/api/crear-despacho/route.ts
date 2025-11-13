import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));
    
    const {
      nombre,
      sedes,
    } = body;
    
    console.log('📋 Sedes recibidas:', sedes?.length || 0);
    console.log('📝 Datos de sedes:', JSON.stringify(sedes, null, 2));

    // Validar campos requeridos
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del despacho es requerido" },
        { status: 400 }
      );
    }

    // Validar que haya al menos una sede
    if (!sedes || !Array.isArray(sedes) || sedes.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos una sede" },
        { status: 400 }
      );
    }

    // Validar campos requeridos de la sede principal
    const sedePrincipal = sedes[0];
    if (!sedePrincipal.localidad || !sedePrincipal.provincia || !sedePrincipal.telefono || !sedePrincipal.email_contacto) {
      return NextResponse.json(
        { error: "Faltan campos requeridos en la sede principal: localidad, provincia, teléfono, email" },
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

    // Obtener email del usuario
    const userEmail = body.user_email || user.email;

    // Crear despacho en Next.js
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .insert({
        nombre,
        slug,
        status: 'publish', // Publicado para sincronizar con WordPress
        num_sedes: sedes.length,
        owner_email: userEmail, // Email del propietario
        wordpress_id: null, // Se asignará cuando se sincronice con WP
        featured_media_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (despachoError) {
      console.error('Error al crear despacho:', despachoError);
      throw despachoError;
    }

    console.log('✅ Despacho creado en Next.js:', despacho.id);

    // Obtener el user_id de la tabla users usando el email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('⚠️ No se encontró el usuario en la tabla users:', userError);
      console.log('📧 Email buscado:', userEmail);
      console.log('🔑 Auth user.id:', user.id);
      
      // Intentar crear el usuario en la tabla users si no existe
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: user.id, // Usar el ID de auth
          email: userEmail,
          role: 'despacho_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createUserError) {
        console.error('❌ Error al crear usuario en tabla users:', createUserError);
      } else {
        console.log('✅ Usuario creado en tabla users:', newUser.id);
      }
    }

    const finalUserId = userData?.id || user.id;

    // Asignar despacho al usuario en user_despachos (solo campos que existen)
    const { error: userDespachoError } = await supabase
      .from('user_despachos')
      .insert({
        user_id: finalUserId,
        despacho_id: despacho.id
        // Los demás campos se asignan por defecto en la BD
      });

    if (userDespachoError) {
      console.error('❌ Error al asignar despacho al usuario:', userDespachoError);
      console.log('📝 Datos intentados:', {
        user_id: finalUserId,
        despacho_id: despacho.id,
        rol: 'propietario'
      });
    } else {
      console.log('✅ Despacho asignado al usuario:', finalUserId);
    }

    // Obtener TODOS los super_admin para notificar
    const { data: superAdmins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'super_admin');

    // Enviar notificación a TODOS los super_admin
    if (superAdmins && superAdmins.length > 0) {
      const notificaciones = superAdmins.map(admin => ({
        user_id: admin.id,
        tipo: 'nuevo_despacho',
        titulo: 'Nuevo despacho creado',
        mensaje: `El usuario ${userEmail} ha creado el despacho "${nombre}"`,
        leida: false,
        url: `/dashboard/admin/despachos/${despacho.id}`,
        metadata: {
          despacho_id: despacho.id,
          user_email: userEmail,
          nombre_despacho: nombre,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: notifError } = await supabase
        .from('notificaciones')
        .insert(notificaciones);

      if (notifError) {
        console.error('Error al crear notificaciones:', notifError);
      } else {
        console.log(`✅ Notificaciones enviadas a ${superAdmins.length} super_admin(s)`);
      }
    }

    // Crear todas las sedes
    const sedesData = sedes.map((sede: {
      nombre: string;
      descripcion?: string;
      calle?: string;
      numero?: string;
      piso?: string;
      localidad: string;
      provincia: string;
      codigo_postal?: string;
      pais?: string;
      telefono: string;
      email_contacto: string;
      persona_contacto?: string;
      web?: string;
      numero_colegiado?: string;
      colegio?: string;
      experiencia?: string;
      areas_practica?: string[];
      especialidades?: string;
      servicios_especificos?: string;
      ano_fundacion?: string;
      tamano_despacho?: string;
      horarios?: {
        lunes?: string;
        martes?: string;
        miercoles?: string;
        jueves?: string;
        viernes?: string;
        sabado?: string;
        domingo?: string;
      };
      redes_sociales?: {
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
      };
      foto_perfil?: string;
      observaciones?: string;
      es_principal?: boolean;
    }) => ({
      despacho_id: despacho.id,
      nombre: sede.nombre || 'Sede',
      descripcion: sede.descripcion || '',
      es_principal: sede.es_principal || false,
      calle: sede.calle || '',
      numero: sede.numero || '',
      piso: sede.piso || '',
      localidad: sede.localidad,
      provincia: sede.provincia,
      codigo_postal: sede.codigo_postal || '',
      pais: sede.pais || 'España',
      telefono: sede.telefono,
      email_contacto: sede.email_contacto,
      persona_contacto: sede.persona_contacto || '',
      web: sede.web || '',
      numero_colegiado: sede.numero_colegiado || '',
      colegio: sede.colegio || '',
      experiencia: sede.experiencia || '',
      areas_practica: sede.areas_practica || [],
      especialidades: sede.especialidades || '',
      servicios_especificos: sede.servicios_especificos || '',
      ano_fundacion: sede.ano_fundacion ? parseInt(sede.ano_fundacion) : null,
      tamano_despacho: sede.tamano_despacho || '',
      horarios: sede.horarios || {},
      redes_sociales: sede.redes_sociales || {},
      foto_perfil: sede.foto_perfil || '',
      observaciones: sede.observaciones || '',
      activa: true,
      estado_verificacion: 'pendiente',
    }));

    console.log('📝 Intentando crear sedes:', JSON.stringify(sedesData, null, 2));
    
    const { error: sedesError } = await supabase
      .from('sedes')
      .insert(sedesData);

    if (sedesError) {
      console.error('❌ Error al crear sedes:', sedesError);
      console.error('📋 Datos que causaron el error:', JSON.stringify(sedesData, null, 2));
      // No lanzamos error, el despacho ya está creado
    } else {
      console.log(`✅ ${sedes.length} sede(s) creada(s)`);
    }

    // Esperar 1 segundo para asegurar que las sedes estén completamente guardadas
    console.log('⏳ Esperando 1 segundo antes de sincronizar con WordPress...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sincronización con WordPress
    console.log('🔄 Sincronizando despacho con WordPress...');
    let wpResult: { success: boolean; objectId?: string | null; error?: string; message?: string } = { success: false, objectId: null, error: 'No ejecutado' };
    
    try {
      const { SyncService } = await import('@/lib/syncService');
      wpResult = await SyncService.enviarDespachoAWordPress(despacho.id);
      
      if (wpResult.success) {
        console.log('✅ Despacho sincronizado con WordPress. Object ID:', wpResult.objectId);
      } else {
        console.error('⚠️ Error al sincronizar con WordPress:', wpResult.error);
        // No fallar la creación, el despacho ya está en Supabase
        // Se puede sincronizar manualmente después
      }
    } catch (syncError) {
      console.error('❌ Excepción al sincronizar con WordPress:', syncError);
      wpResult = { 
        success: false, 
        objectId: null, 
        error: syncError instanceof Error ? syncError.message : 'Error desconocido' 
      };
      // No lanzar error, continuar con la respuesta
    }

    return NextResponse.json({
      success: true,
      message: 'Despacho creado correctamente',
      despachoId: despacho.id,
      objectId: wpResult.objectId,
      sincronizadoWP: wpResult.success,
      sedesCreadas: !sedesError,
      sedesError: sedesError ? {
        message: sedesError.message,
        details: sedesError.details,
        hint: sedesError.hint,
        code: sedesError.code
      } : null,
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
