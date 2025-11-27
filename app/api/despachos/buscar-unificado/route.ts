import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";

const WORDPRESS_API_URL = "https://lexhoy.com/wp-json/wp/v2";

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    console.log(
      `🔍 API Unificada - Búsqueda: "${query}", Página: ${page}, Por página: ${perPage}`
    );

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 0. Obtener el total de despachos en WordPress (sin filtros)
    let totalWordPress = 0;
    try {
      // Hacer una petición mínima para obtener solo el header con el total
      const wpTotalUrl = `${WORDPRESS_API_URL}/despacho?per_page=1&page=1&_fields=id`;
      const wpTotalResponse = await fetch(wpTotalUrl);
      if (wpTotalResponse.ok) {
        // WordPress devuelve el total en el header X-WP-Total
        const totalHeader = wpTotalResponse.headers.get("X-WP-Total");

        totalWordPress = totalHeader ? parseInt(totalHeader) : 0;
      } else {
        console.error(
          "❌ [WordPress] Error en respuesta:",
          wpTotalResponse.status,
          wpTotalResponse.statusText
        );
      }
    } catch (error) {
      console.error("❌ [WordPress] Error al obtener total:", error);
    }

    // 1. Buscar en Supabase (despachos ya importados)
    interface DespachoResult {
      id: string;
      wordpress_id?: number;
      nombre: string;
      slug: string;
      owner_email?: string | null;
      localidad: string;
      provincia: string;
      telefono: string;
      email: string;
      num_sedes: number;
      origen: "supabase" | "wordpress";
      yaImportado: boolean;
    }

    let supabaseResults: DespachoResult[] = [];

    // Construir la consulta base
    let supabaseQuery = supabase.from("despachos").select(`
        id,
        nombre,
        slug,
        wordpress_id,
        owner_email,
        sedes (
          localidad,
          provincia,
          telefono,
          email_contacto
        )
      `);

    // Aplicar filtro de búsqueda solo si hay query
    if (query) {
      supabaseQuery = supabaseQuery.ilike("nombre", `%${query}%`);
    }

    // Para admin, no limitar Supabase para hacer mapeo completo

    const { data: supabaseData } = await supabaseQuery;

    if (supabaseData) {
      supabaseResults = supabaseData.map(
        (despacho: Record<string, unknown>) => {
          const sedes = despacho.sedes as
            | Array<Record<string, unknown>>
            | undefined;
          const sede = sedes?.[0] || {};
          return {
            id: String(despacho.id),
            wordpress_id: despacho.wordpress_id as number | undefined,
            nombre: String(despacho.nombre),
            slug: String(despacho.slug),
            owner_email: despacho.owner_email
              ? String(despacho.owner_email)
              : null,
            localidad: String(sede.localidad || "-"),
            provincia: String(sede.provincia || "-"),
            telefono: String(sede.telefono || "-"),
            email: String(sede.email_contacto || "-"),
            num_sedes: sedes?.length || 0,
            origen: "supabase" as const,
            yaImportado: true,
          };
        }
      );
    }

    // 2. Buscar en WordPress con paginación real
    let wordpressResults: DespachoResult[] = [];
    let totalWordPressFiltered = 0;
    try {
      // Paginar directamente en WordPress
      const wpUrl = `${WORDPRESS_API_URL}/despacho?search=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&_fields=id,title,slug,meta`;
      const wpResponse = await fetch(wpUrl);
      if (wpResponse.ok) {
        const wpData = await wpResponse.json();

        // Obtener el total de resultados filtrados desde el header
        const totalFilteredHeader = wpResponse.headers.get("X-WP-Total");
        totalWordPressFiltered = totalFilteredHeader
          ? parseInt(totalFilteredHeader)
          : 0;

        // Filtrar los que YA están en Supabase
        const wordpressIdsEnSupabase = new Set(
          supabaseResults
            .filter((r) => r.wordpress_id)
            .map((r) => r.wordpress_id)
        );

        wordpressResults = wpData
          .filter(
            (wp: Record<string, unknown>) =>
              !wordpressIdsEnSupabase.has(Number(wp.id))
          )
          .map((wp: Record<string, unknown>) => {
            const meta = wp.meta as Record<string, unknown> | undefined;
            const sedes = meta?._despacho_sedes as
              | Array<Record<string, unknown>>
              | undefined;
            const sede = sedes?.[0] || {};
            const title = wp.title as { rendered?: string } | undefined;

            return {
              id: String(wp.id),
              wordpress_id: Number(wp.id),
              nombre: title?.rendered || "Sin nombre",
              slug: String(wp.slug || ""),
              owner_email: null,
              localidad: String(
                sede.localidad ||
                  (meta?._despacho_localidad as string[])?.[0] ||
                  "-"
              ),
              provincia: String(
                sede.provincia ||
                  (meta?._despacho_provincia as string[])?.[0] ||
                  "-"
              ),
              telefono: String(
                sede.telefono ||
                  (meta?._despacho_telefono as string[])?.[0] ||
                  "-"
              ),
              email: String(
                sede.email_contacto ||
                  (meta?._despacho_email as string[])?.[0] ||
                  "-"
              ),
              num_sedes: sedes?.length || 0,
              origen: "wordpress" as const,
              yaImportado: false,
            };
          });
      }
    } catch (wpError) {
      console.error("❌ [WordPress] Error:", wpError);
    }

    // 3. Combinar resultados (Supabase primero, luego WordPress)
    const allResults = [...supabaseResults, ...wordpressResults];

    // 4. Usar el total de WordPress para calcular las páginas totales
    const totalResults = query ? totalWordPressFiltered : totalWordPress;

    console.log(
      "✅ [Resultado] Supabase:",
      supabaseResults.length,
      ", WordPress:",
      wordpressResults.length,
      ", Total:",
      allResults.length
    );
    console.log(
      "📄 [Paginación] Devolviendo",
      allResults.length,
      "resultados para página",
      page
    );

    return NextResponse.json({
      data: allResults, // Ya vienen paginados de WordPress
      pagination: {
        page,
        perPage,
        total: totalResults, // Total real (con o sin filtro)
        totalPages: Math.ceil(totalResults / perPage),
      },
      stats: {
        enSupabase: supabaseResults.length,
        enWordPress: wordpressResults.length,
        total: allResults.length,
      },
      totalWordPress, // Total real de despachos en WordPress (sin filtros)
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
