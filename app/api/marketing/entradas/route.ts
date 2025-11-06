import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const estado = searchParams.get("estado") || "publish"; // publish, draft, etc.
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "9";

    if (!categoria) {
      return NextResponse.json(
        { error: "Se requiere el parámetro categoria" },
        { status: 400 }
      );
    }

    // Si se proporciona un slug de categoría, buscar su ID primero
    let categoryId = categoria;
    if (categoria !== "all" && isNaN(Number(categoria))) {
      // Es un slug, necesitamos obtener el ID
      try {
        const catResponse = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/categories?slug=${categoria}`
        );
        const categories = await catResponse.json();
        if (categories && categories.length > 0) {
          categoryId = categories[0].id.toString();
          console.log(`📁 Categoría "${categoria}" encontrada con ID: ${categoryId}`);
        } else {
          console.warn(`⚠️ No se encontró la categoría con slug: ${categoria}`);
        }
      } catch (err) {
        console.error("Error buscando categoría:", err);
      }
    }

    // Construir la URL de WordPress API
    const wpApiUrl = new URL("https://lexhoy.com/wp-json/wp/v2/posts");
    wpApiUrl.searchParams.append("_embed", "true"); // Para obtener imagen destacada
    wpApiUrl.searchParams.append("per_page", perPage);
    wpApiUrl.searchParams.append("page", page);
    
    // WordPress API pública solo permite 'publish' sin autenticación
    // Para otros estados necesitaríamos autenticación
    if (estado !== "any") {
      wpApiUrl.searchParams.append("status", estado);
    }
    // Si es 'any', no agregamos el parámetro status (por defecto es 'publish')

    // Si se proporciona categoría, buscarla primero
    if (categoryId !== "all") {
      wpApiUrl.searchParams.append("categories", categoryId);
    }

    console.log("🔍 Fetching posts from WordPress:", wpApiUrl.toString());

    // Preparar headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Si necesitamos acceder a borradores, agregar autenticación
    // Usar variables de entorno existentes para credenciales de WordPress
    if (estado === "draft" || estado === "pending" || estado === "private") {
      const wpUser = process.env.WORDPRESS_USERNAME?.trim();
      const wpPassword = process.env.WORDPRESS_APPLICATION_PASSWORD?.trim();
      
      if (wpUser && wpPassword) {
        // Remover espacios de la contraseña (Application Passwords a veces tienen espacios)
        const cleanPassword = wpPassword.replace(/\s+/g, '');
        const credentials = Buffer.from(`${wpUser}:${cleanPassword}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        console.log(`🔐 Usando autenticación para acceder a borradores`);
        console.log(`   Usuario: ${wpUser}`);
        console.log(`   Contraseña limpia: ${cleanPassword.substring(0, 4)}...${cleanPassword.substring(cleanPassword.length - 4)}`);
      } else {
        console.warn("⚠️ Credenciales de WordPress no configuradas. No se pueden obtener borradores.");
        console.warn(`   WORDPRESS_USERNAME: ${wpUser ? 'configurado' : 'NO configurado'}`);
        console.warn(`   WORDPRESS_APPLICATION_PASSWORD: ${wpPassword ? 'configurado' : 'NO configurado'}`);
      }
    }

    const response = await fetch(wpApiUrl.toString(), {
      headers,
      next: { revalidate: 300 }, // Cache por 5 minutos
    });

    if (!response.ok) {
      // Intentar obtener más detalles del error
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.json();
        errorDetails = JSON.stringify(errorBody);
        console.error("❌ WordPress API Error Details:", errorBody);
      } catch {
        console.error("❌ WordPress API Error (no JSON):", response.statusText);
      }
      throw new Error(`WordPress API error (${response.status}): ${errorDetails}`);
    }

    const posts = await response.json();
    
    // Obtener headers de paginación de WordPress
    const totalPosts = response.headers.get("X-WP-Total");
    const totalPages = response.headers.get("X-WP-TotalPages");

    console.log(`📊 Posts en esta página: ${posts.length}, Total: ${totalPosts}, Páginas: ${totalPages}`);

    // Transformar los datos para el frontend
    const entradasFormateadas = posts.map((post: Record<string, unknown>) => {
      // Extraer imagen destacada
      let imagenUrl = "https://via.placeholder.com/600x400?text=Sin+Imagen";
      
      if (post._embedded && typeof post._embedded === 'object') {
        const embedded = post._embedded as Record<string, unknown>;
        if (Array.isArray(embedded['wp:featuredmedia']) && embedded['wp:featuredmedia'].length > 0) {
          const featuredMedia = embedded['wp:featuredmedia'][0] as Record<string, unknown>;
          if (featuredMedia.source_url && typeof featuredMedia.source_url === 'string') {
            imagenUrl = featuredMedia.source_url;
          }
        }
      }

      // Extraer extracto sin HTML
      let extracto = "";
      if (post.excerpt && typeof post.excerpt === 'object') {
        const excerptObj = post.excerpt as Record<string, unknown>;
        if (excerptObj.rendered && typeof excerptObj.rendered === 'string') {
          extracto = excerptObj.rendered.replace(/<[^>]*>/g, "").substring(0, 150);
        }
      }

      // Extraer título
      let titulo = "Sin título";
      if (post.title && typeof post.title === 'object') {
        const titleObj = post.title as Record<string, unknown>;
        if (titleObj.rendered && typeof titleObj.rendered === 'string') {
          titulo = titleObj.rendered;
        }
      }

      // Extraer categorías
      let categorias: number[] = [];
      if (Array.isArray(post.categories)) {
        categorias = post.categories as number[];
      }

      // Extraer slugs de categorías desde _embedded
      let categoriaSlugs: string[] = [];
      if (post._embedded && typeof post._embedded === 'object') {
        const embedded = post._embedded as Record<string, unknown>;
        if (Array.isArray(embedded['wp:term'])) {
          const terms = embedded['wp:term'] as unknown[][];
          if (terms.length > 0 && Array.isArray(terms[0])) {
            categoriaSlugs = terms[0]
              .filter((term): term is Record<string, unknown> => typeof term === 'object' && term !== null)
              .map(term => term.slug as string)
              .filter(slug => typeof slug === 'string');
          }
        }
      }

      return {
        id: post.id,
        titulo,
        extracto,
        imagenUrl,
        link: post.link,
        fecha: post.date,
        estado: post.status,
        categorias,
        categoriaSlugs,
      };
    });

    // Log de debug: mostrar categorías de las primeras 3 entradas
    if (entradasFormateadas.length > 0) {
      console.log("🏷️ Categorías de las primeras entradas:");
      entradasFormateadas.slice(0, 3).forEach((entrada: { titulo: string; categoriaSlugs: string[] }) => {
        console.log(`  - "${entrada.titulo}": [${entrada.categoriaSlugs.join(", ")}]`);
      });
    }

    return NextResponse.json({
      success: true,
      entradas: entradasFormateadas,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: totalPosts ? parseInt(totalPosts) : entradasFormateadas.length,
        totalPages: totalPages ? parseInt(totalPages) : 1,
        hasMore: totalPages ? parseInt(page) < parseInt(totalPages) : false,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching WordPress posts:", error);
    return NextResponse.json(
      {
        error: "Error al obtener las entradas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
