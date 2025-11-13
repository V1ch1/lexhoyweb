import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para detectar y limpiar duplicados en Supabase
 * Solo accesible para super admins
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

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

    // Verificar que sea super admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: "No tienes permisos para esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dryRun = true } = body;

    // 1. Buscar duplicados por wordpress_id
    const { data: todosDespachos } = await supabase
      .from('despachos')
      .select('id, nombre, slug, wordpress_id, object_id, created_at')
      .order('created_at', { ascending: true });

    if (!todosDespachos) {
      return NextResponse.json({ error: "Error al obtener despachos" }, { status: 500 });
    }

    const duplicadosPorWordPressId: Record<number, typeof todosDespachos> = {};
    const duplicadosPorNombre: Record<string, typeof todosDespachos> = {};
    const duplicadosPorSlug: Record<string, typeof todosDespachos> = {};

    // Agrupar por wordpress_id
    for (const despacho of todosDespachos) {
      if (despacho.wordpress_id) {
        if (!duplicadosPorWordPressId[despacho.wordpress_id]) {
          duplicadosPorWordPressId[despacho.wordpress_id] = [];
        }
        duplicadosPorWordPressId[despacho.wordpress_id].push(despacho);
      }

      // Agrupar por nombre (normalizado)
      const nombreNormalizado = despacho.nombre.toLowerCase().trim();
      if (!duplicadosPorNombre[nombreNormalizado]) {
        duplicadosPorNombre[nombreNormalizado] = [];
      }
      duplicadosPorNombre[nombreNormalizado].push(despacho);

      // Agrupar por slug
      if (despacho.slug) {
        if (!duplicadosPorSlug[despacho.slug]) {
          duplicadosPorSlug[despacho.slug] = [];
        }
        duplicadosPorSlug[despacho.slug].push(despacho);
      }
    }

    // Filtrar solo grupos con duplicados
    const duplicadosWpId = Object.entries(duplicadosPorWordPressId)
      .filter(([, despachos]) => despachos.length > 1);
    
    const duplicadosNombre = Object.entries(duplicadosPorNombre)
      .filter(([, despachos]) => despachos.length > 1);
    
    const duplicadosSlug = Object.entries(duplicadosPorSlug)
      .filter(([, despachos]) => despachos.length > 1);

    const acciones: Array<{
      tipo: string;
      mantener: string;
      eliminar: string[];
      razon: string;
    }> = [];

    // Procesar duplicados por wordpress_id (más confiable)
    for (const [wpId, despachos] of duplicadosWpId) {
      // Mantener el más antiguo (primero creado)
      const mantener = despachos[0];
      const eliminar = despachos.slice(1);

      acciones.push({
        tipo: 'wordpress_id',
        mantener: mantener.id,
        eliminar: eliminar.map(d => d.id),
        razon: `Duplicados con wordpress_id=${wpId}. Manteniendo el más antiguo (${mantener.created_at})`,
      });

      if (!dryRun) {
        // Eliminar duplicados
        for (const duplicado of eliminar) {
          // Eliminar sedes asociadas
          await supabase
            .from('sedes')
            .delete()
            .eq('despacho_id', duplicado.id);
          
          // Eliminar despacho
          await supabase
            .from('despachos')
            .delete()
            .eq('id', duplicado.id);
        }
      }
    }

    // Procesar duplicados por nombre (solo si no tienen wordpress_id)
    for (const [nombre, despachos] of duplicadosNombre) {
      // Filtrar solo los que NO tienen wordpress_id
      const sinWpId = despachos.filter(d => !d.wordpress_id);
      
      if (sinWpId.length > 1) {
        const mantener = sinWpId[0];
        const eliminar = sinWpId.slice(1);

        acciones.push({
          tipo: 'nombre',
          mantener: mantener.id,
          eliminar: eliminar.map(d => d.id),
          razon: `Duplicados con nombre="${nombre}" sin wordpress_id. Manteniendo el más antiguo`,
        });

        if (!dryRun) {
          for (const duplicado of eliminar) {
            await supabase
              .from('sedes')
              .delete()
              .eq('despacho_id', duplicado.id);
            
            await supabase
              .from('despachos')
              .delete()
              .eq('id', duplicado.id);
          }
        }
      }
    }

    const totalEliminar = acciones.reduce((sum, a) => sum + a.eliminar.length, 0);

    return NextResponse.json({
      success: true,
      dryRun,
      duplicadosEncontrados: {
        porWordPressId: duplicadosWpId.length,
        porNombre: duplicadosNombre.length,
        porSlug: duplicadosSlug.length,
      },
      acciones,
      totalAEliminar: totalEliminar,
      mensaje: dryRun 
        ? `Se encontraron ${totalEliminar} despachos duplicados. Ejecuta con dryRun=false para eliminarlos.`
        : `Se eliminaron ${totalEliminar} despachos duplicados correctamente.`,
    });

  } catch (error) {
    console.error('❌ Error al limpiar duplicados:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Solo detectar duplicados sin eliminar
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

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

    // Buscar duplicados
    const { data: todosDespachos } = await supabase
      .from('despachos')
      .select('id, nombre, slug, wordpress_id, object_id, created_at')
      .order('created_at', { ascending: true });

    if (!todosDespachos) {
      return NextResponse.json({ error: "Error al obtener despachos" }, { status: 500 });
    }

    const duplicadosPorWordPressId: Record<number, typeof todosDespachos> = {};
    const duplicadosPorNombre: Record<string, typeof todosDespachos> = {};

    for (const despacho of todosDespachos) {
      if (despacho.wordpress_id) {
        if (!duplicadosPorWordPressId[despacho.wordpress_id]) {
          duplicadosPorWordPressId[despacho.wordpress_id] = [];
        }
        duplicadosPorWordPressId[despacho.wordpress_id].push(despacho);
      }

      const nombreNormalizado = despacho.nombre.toLowerCase().trim();
      if (!duplicadosPorNombre[nombreNormalizado]) {
        duplicadosPorNombre[nombreNormalizado] = [];
      }
      duplicadosPorNombre[nombreNormalizado].push(despacho);
    }

    const duplicadosWpId = Object.entries(duplicadosPorWordPressId)
      .filter(([, despachos]) => despachos.length > 1)
      .map(([wpId, despachos]) => ({
        wordpress_id: parseInt(wpId),
        despachos: despachos.map(d => ({
          id: d.id,
          nombre: d.nombre,
          created_at: d.created_at,
        })),
      }));
    
    const duplicadosNombre = Object.entries(duplicadosPorNombre)
      .filter(([, despachos]) => despachos.length > 1)
      .map(([nombre, despachos]) => ({
        nombre,
        despachos: despachos.map(d => ({
          id: d.id,
          wordpress_id: d.wordpress_id,
          created_at: d.created_at,
        })),
      }));

    return NextResponse.json({
      duplicadosPorWordPressId: duplicadosWpId,
      duplicadosPorNombre: duplicadosNombre,
      total: {
        porWordPressId: duplicadosWpId.length,
        porNombre: duplicadosNombre.length,
      },
    });

  } catch (error) {
    console.error('❌ Error al detectar duplicados:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
