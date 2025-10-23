import { NextResponse } from "next/server";

/**
 * Busca despachos en WordPress
 * GET /api/despachos/wordpress/buscar?query=...&id=...&provincia=...&localidad=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const id = searchParams.get("id");
  const provincia = searchParams.get("provincia") || "";
  const localidad = searchParams.get("localidad") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  
  console.log('🔍 [WordPress] Búsqueda de despacho:', { 
    query, 
    id, 
    provincia, 
    localidad, 
    page, 
    perPage 
  });
  
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
    console.log('🔎 [WordPress] Buscando por texto:', { query, provincia, localidad });
    let resultados = await buscarDespachosPorTexto(query);
    
    // Aplicar filtros si existen
    if (provincia || localidad) {
      resultados = resultados.filter((despacho: any) => {
        const sedes = despacho.meta?._despacho_sedes || [];
        
        // Si no hay sedes, no pasa ningún filtro
        if (!sedes.length) return false;
        
        // Filtrar por provincia si se especificó
        if (provincia && sedes[0].provincia !== provincia) {
          return false;
        }
        
        // Filtrar por localidad si se especificó
        if (localidad && sedes[0].localidad !== localidad) {
          return false;
        }
        
        return true;
      });
    }
    
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
  // Asegurarse de incluir los campos de metadatos necesarios (_despacho_sedes)
  const searchUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=50&_fields=id,title,content,meta`;
  
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
