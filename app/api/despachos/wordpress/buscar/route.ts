import { NextResponse } from "next/server";

/**
 * Busca despachos en WordPress
 * GET /api/despachos/wordpress/buscar?query=...&id=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  
  console.log('🔍 [WordPress] Búsqueda de despacho:', { query, id, page, perPage });
  
  // Si no hay query ni id, devolver lista vacía en lugar de error
  if (!query && !id) {
    return NextResponse.json({
      data: [],
      pagination: {
        page,
        perPage,
        total: 0,
        totalPages: 0
      }
    });
  }

  try {
    // Si busca por ID, obtener el despacho completo de WordPress
    if (id) {
      console.log('🌐 [WordPress] Buscando por ID:', id);
      const despacho = await buscarDespachoPorId(id);
      return NextResponse.json(despacho ? [despacho] : []);
    }
    
    // Búsqueda por texto
    console.log('🔎 [WordPress] Buscando por texto:', query);
    const resultados = await buscarDespachosPorTexto(query);
    
    // Aplicar paginación
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedResults = resultados.slice(start, end);
    
    return NextResponse.json({
      data: paginatedResults,
      pagination: {
        page,
        perPage,
        total: resultados.length,
        totalPages: Math.ceil(resultados.length / perPage)
      }
    });
    
  } catch (error) {
    console.error('❌ [WordPress] Error en la búsqueda:', error);
    return NextResponse.json(
      { error: "Error al buscar en WordPress", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Busca un despacho por su ID en WordPress
 */
async function buscarDespachoPorId(id: string) {
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
  
  if (!username || !appPassword) {
    throw new Error("Credenciales de WordPress no configuradas");
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const wpUrl = `https://lexhoy.com/wp-json/wp/v2/despacho/${id}`;
  
  console.log('🌐 [WordPress] Consultando:', wpUrl);
  
  const response = await fetch(wpUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [WordPress] Error en la respuesta:', response.status, errorText);
    return null;
  }
  
  return await response.json();
}

/**
 * Busca despachos por texto en WordPress
 */
async function buscarDespachosPorTexto(query: string) {
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
  
  if (!username || !appPassword) {
    throw new Error("Credenciales de WordPress no configuradas");
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const searchUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=20`;
  
  console.log('🔍 [WordPress] Buscando:', searchUrl);
  
  const response = await fetch(searchUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en la búsqueda: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}
