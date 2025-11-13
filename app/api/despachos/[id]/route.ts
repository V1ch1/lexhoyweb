import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para eliminar un despacho (solo super admin)
 * Elimina de NextJS, WordPress y Algolia
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params en Next.js 15
    const { id } = await params;
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

    console.log('🔐 Usuario autenticado:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    });

    // Verificar que el usuario es super admin
    // Primero intentar obtener el rol de los metadatos del usuario
    let userRole = user.user_metadata?.role || user.app_metadata?.role;
    
    console.log('📋 Rol desde metadatos:', userRole);
    
    // Si no está en los metadatos, buscar en la tabla users
    if (!userRole) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('rol')  // La columna se llama 'rol' (sin 'e')
        .eq('id', user.id)
        .single();
      
      userRole = userData?.rol;
      
      console.log('🔍 Verificación de rol:', {
        userId: user.id,
        email: user.email,
        roleFromMetadata: user.user_metadata?.role || user.app_metadata?.role,
        roleFromTable: userData?.rol,
        finalRole: userRole,
        error: userError
      });
    }

    if (!userRole || userRole !== 'super_admin') {
      console.error('❌ Acceso denegado. Rol del usuario:', userRole);
      return NextResponse.json({ 
        error: "No tienes permisos para eliminar despachos. Solo los super administradores pueden realizar esta acción.",
        debug: {
          userId: user.id,
          email: user.email,
          currentRole: userRole,
          requiredRole: 'super_admin'
        }
      }, { status: 403 });
    }
    
    console.log('✅ Usuario verificado como super_admin:', user.email);

    const despachoId = id;
    console.log('🗑️ Iniciando eliminación de despacho:', despachoId);

    // Obtener datos del despacho antes de eliminarlo
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select('*')
      .eq('id', despachoId)
      .single();

    if (despachoError || !despacho) {
      return NextResponse.json({ 
        error: "Despacho no encontrado" 
      }, { status: 404 });
    }

    console.log('📋 Despacho encontrado:', despacho.nombre, 'Object ID:', despacho.object_id);

    // 1. Eliminar de WordPress si tiene object_id
    let wpDeleted = false;
    if (despacho.object_id) {
      try {
        console.log('🔄 Eliminando de WordPress...');
        
        const username = process.env.WORDPRESS_USERNAME;
        const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
        
        if (username && appPassword) {
          const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
          
          const wpResponse = await fetch(
            `https://lexhoy.com/wp-json/wp/v2/despacho/${despacho.object_id}?force=true`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (wpResponse.ok) {
            wpDeleted = true;
            console.log('✅ Despacho eliminado de WordPress');
          } else {
            console.error('⚠️ Error al eliminar de WordPress:', wpResponse.status, wpResponse.statusText);
          }
        }
      } catch (wpError) {
        console.error('❌ Excepción al eliminar de WordPress:', wpError);
      }
    }

    // 2. Eliminar de Algolia (usando el object_id o el id del despacho)
    let algoliaDeleted = false;
    try {
      console.log('🔄 Eliminando de Algolia...');
      
      // Usar el object_id para eliminar de Algolia
      
      // Hacer llamada a WordPress para que elimine de Algolia
      if (despacho.object_id) {
        const username = process.env.WORDPRESS_USERNAME;
        const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
        
        if (username && appPassword) {
          const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
          
          // Llamar a un endpoint personalizado de WordPress para eliminar de Algolia
          const algoliaResponse = await fetch(
            `https://lexhoy.com/wp-json/lexhoy-despachos/v1/delete-algolia/${despacho.object_id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (algoliaResponse.ok) {
            algoliaDeleted = true;
            console.log('✅ Despacho eliminado de Algolia');
          } else {
            console.error('⚠️ Error al eliminar de Algolia:', algoliaResponse.status);
          }
        }
      }
    } catch (algoliaError) {
      console.error('❌ Excepción al eliminar de Algolia:', algoliaError);
    }

    // 3. Eliminar sedes asociadas de NextJS
    const { error: sedesError } = await supabase
      .from('sedes')
      .delete()
      .eq('despacho_id', despachoId);

    if (sedesError) {
      console.error('⚠️ Error al eliminar sedes:', sedesError);
    } else {
      console.log('✅ Sedes eliminadas de NextJS');
    }

    // 4. Eliminar relaciones user_despachos
    const { error: userDespachoError } = await supabase
      .from('user_despachos')
      .delete()
      .eq('despacho_id', despachoId);

    if (userDespachoError) {
      console.error('⚠️ Error al eliminar relaciones user_despachos:', userDespachoError);
    } else {
      console.log('✅ Relaciones user_despachos eliminadas');
    }

    // 5. Eliminar notificaciones relacionadas
    const { error: notificacionesError } = await supabase
      .from('notificaciones')
      .delete()
      .eq('metadata->>despacho_id', despachoId);

    if (notificacionesError) {
      console.error('⚠️ Error al eliminar notificaciones:', notificacionesError);
    } else {
      console.log('✅ Notificaciones eliminadas');
    }

    // 6. Finalmente, eliminar el despacho de NextJS
    const { error: deleteError } = await supabase
      .from('despachos')
      .delete()
      .eq('id', despachoId);

    if (deleteError) {
      console.error('❌ Error al eliminar despacho de NextJS:', deleteError);
      return NextResponse.json({ 
        error: "Error al eliminar despacho de la base de datos" 
      }, { status: 500 });
    }

    console.log('✅ Despacho eliminado completamente');

    // Crear notificación para otros super admins
    const { data: superAdmins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'super_admin')
      .neq('id', user.id); // Excluir al usuario que eliminó

    if (superAdmins && superAdmins.length > 0) {
      const notificaciones = superAdmins.map(admin => ({
        user_id: admin.id,
        tipo: 'despacho_eliminado',
        titulo: 'Despacho eliminado',
        mensaje: `El super admin ${user.email} ha eliminado el despacho "${despacho.nombre}"`,
        leida: false,
        metadata: {
          despacho_id: despachoId,
          despacho_nombre: despacho.nombre,
          eliminado_por: user.email,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('notificaciones')
        .insert(notificaciones);
    }

    return NextResponse.json({
      success: true,
      message: 'Despacho eliminado correctamente',
      details: {
        nextjs: true,
        wordpress: wpDeleted,
        algolia: algoliaDeleted,
        sedes: !sedesError,
        relaciones: !userDespachoError,
        notificaciones: !notificacionesError,
      }
    });

  } catch (error) {
    console.error('❌ Error al eliminar despacho:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
