import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WORDPRESS_API_URL = "https://lexhoy.com/wp-json/wp/v2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "*";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");

    console.log(`🔍 Admin API - Búsqueda: "${query}", Página: ${page}, Por página: ${perPage}`);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Obtener total de despachos en WordPress
    let totalWordPress = 0;
    try {
      const wpTotalUrl = `${WORDPRESS_API_URL}/despacho?per_page=1&page=1&_fields=id`;
      const wpTotalResponse = await fetch(wpTotalUrl);
      if (wpTotalResponse.ok) {
        const totalHeader = wpTotalResponse.headers.get('X-WP-Total');
        totalWordPress = totalHeader ? parseInt(totalHeader) : 0;
      }
    } catch (error) {
      console.error("Error obteniendo total WordPress:", error);
    }

    // 2. Obtener TODOS los despachos de Supabase (con información completa)
    const { data: allSupabaseDespachos, error: supabaseError } = await supabase
      .from("despachos")
      .select(`
        id,
        nombre,
        slug,
        wordpress_id,
        created_at,
        updated_at,
        verificado,
        activo,
        sincronizado_wp,
        owner_email,
        object_id
      `);

    if (supabaseError) {
      console.error("Error obteniendo despachos Supabase:", supabaseError);
    }

    // 3. Crear mapa de despachos de Supabase por wordpress_id y slug
    const supabaseByWpId = new Map();
    const supabaseBySlug = new Map();
    
    (allSupabaseDespachos || []).forEach((despacho) => {
      if (despacho.wordpress_id) {
        supabaseByWpId.set(despacho.wordpress_id, despacho);
      }
      if (despacho.slug) {
        supabaseBySlug.set(despacho.slug, despacho);
      }
    });

    // 4. Obtener TODOS los despachos de WordPress (no paginados para hacer el mapeo completo)
    let allWordpressDespachos = [];
    try {
      const searchQuery = query === "*" ? "" : query;
      // Si hay búsqueda específica, buscar con mayor límite
      const limit = query === "*" ? perPage : 500; // Para búsquedas específicas, obtenemos más resultados
      const wpUrl = `${WORDPRESS_API_URL}/despacho?search=${encodeURIComponent(searchQuery)}&per_page=${limit}&page=${query === "*" ? page : 1}&_fields=id,title,slug,status,date,modified,meta`;
      const wpResponse = await fetch(wpUrl);
      
      if (wpResponse.ok) {
        allWordpressDespachos = await wpResponse.json();
      }
    } catch (error) {
      console.error("Error obteniendo despachos WordPress:", error);
    }

    // 5. Procesar datos de WordPress con sus correspondientes en Supabase
    const despachosProcessed = [];

    for (const wpDespacho of allWordpressDespachos) {
      // Buscar si este despacho existe en Supabase
      const supabaseDespacho = supabaseByWpId.get(wpDespacho.id) || 
                               supabaseBySlug.get(wpDespacho.slug);

      if (supabaseDespacho) {
        // Existe en ambos sistemas - SINCRONIZADO
        
        // Obtener conteo de sedes
        const { data: sedesData } = await supabase
          .from("sedes")
          .select("id")
          .eq("despacho_id", supabaseDespacho.id);

        // Obtener propietario
        const { data: ownerData } = await supabase
          .from("user_despachos")
          .select("users(nombre, apellidos, email)")
          .eq("despacho_id", supabaseDespacho.id)
          .eq("activo", true)
          .single();

        const meta = wpDespacho.meta || {};
        const sedes = meta._despacho_sedes || [];
        const sede = sedes[0] || {};

        despachosProcessed.push({
          id: supabaseDespacho.id,
          nombre: wpDespacho.title?.rendered || supabaseDespacho.nombre,
          slug: wpDespacho.slug || supabaseDespacho.slug,
          wordpress_id: wpDespacho.id,
          created_at: supabaseDespacho.created_at,
          updated_at: supabaseDespacho.updated_at,
          verificado: supabaseDespacho.verificado,
          activo: supabaseDespacho.activo,
          num_sedes: sedesData?.length || 0,
          owner_info: ownerData?.users || null,
          owner_email: supabaseDespacho.owner_email,
          // Estados específicos
          exists_in_supabase: true,
          exists_in_wp: true,
          algolia_indexed: supabaseDespacho.verificado,
          // Datos de ubicación desde WordPress
          localidad: sede.localidad || meta._despacho_localidad?.[0] || "-",
          provincia: sede.provincia || meta._despacho_provincia?.[0] || "-",
          telefono: sede.telefono || meta._despacho_telefono?.[0] || "-",
          email: sede.email_contacto || meta._despacho_email?.[0] || "-",
        });
      } else {
        // Solo existe en WordPress
        const meta = wpDespacho.meta || {};
        const sedes = meta._despacho_sedes || [];
        const sede = sedes[0] || {};

        despachosProcessed.push({
          id: `wp-${wpDespacho.id}`,
          nombre: wpDespacho.title?.rendered || "Sin título",
          slug: wpDespacho.slug,
          wordpress_id: wpDespacho.id,
          created_at: wpDespacho.date,
          updated_at: wpDespacho.modified,
          verificado: false,
          activo: wpDespacho.status === "publish",
          num_sedes: sedes.length,
          owner_info: null,
          owner_email: null,
          // Estados específicos
          exists_in_supabase: false,
          exists_in_wp: true,
          algolia_indexed: false,
          // Datos de ubicación
          localidad: sede.localidad || meta._despacho_localidad?.[0] || "-",
          provincia: sede.provincia || meta._despacho_provincia?.[0] || "-",
          telefono: sede.telefono || meta._despacho_telefono?.[0] || "-",
          email: sede.email_contacto || meta._despacho_email?.[0] || "-",
        });
      }
    }

    // 6. Añadir despachos que están SOLO en Supabase (no tienen wordpress_id)
    const wpIds = new Set(allWordpressDespachos.map((wp: Record<string, unknown>) => wp.id));
    
    for (const supabaseDespacho of (allSupabaseDespachos || [])) {
      // Si no tiene wordpress_id O si su wordpress_id no está en la lista actual de WordPress
      if (!supabaseDespacho.wordpress_id || !wpIds.has(supabaseDespacho.wordpress_id)) {
        // Verificar si coincide con la búsqueda
        if (query !== "*") {
          const nombreMatch = supabaseDespacho.nombre?.toLowerCase().includes(query.toLowerCase());
          if (!nombreMatch) continue; // Skip si no coincide con la búsqueda
        }
        
        // Obtener información adicional
        const { data: sedesData } = await supabase
          .from("sedes")
          .select("*")
          .eq("despacho_id", supabaseDespacho.id);

        const { data: ownerData } = await supabase
          .from("user_despachos")
          .select("users(nombre, apellidos, email)")
          .eq("despacho_id", supabaseDespacho.id)
          .eq("activo", true)
          .single();

        const sede = sedesData?.[0] || {};

        despachosProcessed.push({
          id: supabaseDespacho.id,
          nombre: supabaseDespacho.nombre,
          slug: supabaseDespacho.slug,
          wordpress_id: supabaseDespacho.wordpress_id || null,
          created_at: supabaseDespacho.created_at,
          updated_at: supabaseDespacho.updated_at,
          verificado: supabaseDespacho.verificado,
          activo: supabaseDespacho.activo,
          num_sedes: sedesData?.length || 0,
          owner_info: ownerData?.users || null,
          owner_email: supabaseDespacho.owner_email,
          // Estados específicos
          exists_in_supabase: true,
          exists_in_wp: false,
          algolia_indexed: supabaseDespacho.verificado,
          // Datos de ubicación
          localidad: sede.localidad || "-",
          provincia: sede.provincia || "-", 
          telefono: sede.telefono || "-",
          email: sede.email_contacto || "-",
        });
      }
    }

    // 7. Si es búsqueda específica, aplicar paginación manual
    let finalResults = despachosProcessed;
    if (query !== "*") {
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      finalResults = despachosProcessed.slice(startIndex, endIndex);
    }

    return NextResponse.json({
      success: true,
      data: finalResults,
      totalWordPress,
      totalResults: despachosProcessed.length,
      page,
      perPage,
    });

  } catch (error) {
    console.error("Error en API admin despachos:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}