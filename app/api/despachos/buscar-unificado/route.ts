import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WORDPRESS_API_URL = "https://lexhoy.com/wp-json/wp/v2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    console.log("🔍 [Búsqueda Unificada] Query:", query);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar en Supabase (despachos ya importados)
    let supabaseResults: any[] = [];
    if (query) {
      const { data: supabaseData } = await supabase
        .from("despachos")
        .select(`
          id,
          nombre,
          slug,
          wordpress_id,
          sedes (
            localidad,
            provincia,
            telefono,
            email_contacto
          )
        `)
        .ilike("nombre", `%${query}%`)
        .limit(50);

      if (supabaseData) {
        supabaseResults = supabaseData.map((despacho: any) => {
          const sede = despacho.sedes?.[0] || {};
          return {
            id: despacho.id,
            wordpress_id: despacho.wordpress_id,
            nombre: despacho.nombre,
            slug: despacho.slug,
            localidad: sede.localidad || "-",
            provincia: sede.provincia || "-",
            telefono: sede.telefono || "-",
            email: sede.email_contacto || "-",
            num_sedes: despacho.sedes?.length || 0,
            origen: "supabase" as const,
            yaImportado: true,
          };
        });
      }
    }

    console.log(`✅ [Supabase] ${supabaseResults.length} resultados`);

    // 2. Buscar en WordPress (despachos disponibles para importar)
    let wordpressResults: any[] = [];
    try {
      const wpUrl = `${WORDPRESS_API_URL}/despacho?search=${encodeURIComponent(query)}&per_page=50&_fields=id,title,content,meta`;
      console.log("🔍 [WordPress] URL:", wpUrl);

      const wpResponse = await fetch(wpUrl);
      if (wpResponse.ok) {
        const wpData = await wpResponse.json();

        // Filtrar los que YA están en Supabase
        const wordpressIdsEnSupabase = new Set(
          supabaseResults
            .filter(r => r.wordpress_id)
            .map(r => r.wordpress_id)
        );

        wordpressResults = wpData
          .filter((wp: any) => !wordpressIdsEnSupabase.has(wp.id))
          .map((wp: any) => {
            const sede = wp.meta?._despacho_sedes?.[0] || {};
            return {
              id: wp.id, // WordPress ID
              wordpress_id: wp.id,
              nombre: wp.title?.rendered || "Sin nombre",
              slug: wp.slug || "",
              localidad: sede.localidad || wp.meta?._despacho_localidad?.[0] || "-",
              provincia: sede.provincia || wp.meta?._despacho_provincia?.[0] || "-",
              telefono: sede.telefono || wp.meta?._despacho_telefono?.[0] || "-",
              email: sede.email_contacto || wp.meta?._despacho_email?.[0] || "-",
              num_sedes: wp.meta?._despacho_sedes?.length || 0,
              origen: "wordpress" as const,
              yaImportado: false,
            };
          });
      }
    } catch (wpError) {
      console.error("❌ [WordPress] Error:", wpError);
    }

    console.log(`✅ [WordPress] ${wordpressResults.length} resultados (no importados)`);

    // 3. Combinar resultados (Supabase primero, luego WordPress)
    const allResults = [...supabaseResults, ...wordpressResults];

    // 4. Paginar
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedResults = allResults.slice(startIndex, endIndex);

    console.log(`📊 [Total] ${allResults.length} resultados, mostrando ${paginatedResults.length}`);

    return NextResponse.json({
      data: paginatedResults,
      pagination: {
        page,
        perPage,
        total: allResults.length,
        totalPages: Math.ceil(allResults.length / perPage),
      },
      stats: {
        enSupabase: supabaseResults.length,
        enWordPress: wordpressResults.length,
        total: allResults.length,
      },
    });
  } catch (error) {
    console.error("💥 [Error] Búsqueda unificada:", error);
    return NextResponse.json(
      {
        error: "Error en búsqueda unificada",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
