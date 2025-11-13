import { NextResponse } from "next/server";
import { 
  BusquedaDespachosResponse, 
  BusquedaDespachosParams, 
  DespachoWP 
} from "@/types/wordpress";

/**
 * Busca despachos en WordPress
 * GET /api/despachos/wordpress/buscar?query=...&id=...&provincia=...&localidad=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Asegurarse de que los valores numéricos tengan valores por defecto
  const page = parseInt(searchParams.get("page") || "1") || 1;
  const perPage = parseInt(searchParams.get("perPage") || "10") || 10;
  
  const params: Required<BusquedaDespachosParams> = {
    query: searchParams.get("query") || "",
    id: searchParams.get("id") || null,
    provincia: searchParams.get("provincia") || "",
    localidad: searchParams.get("localidad") || "",
    page,
    perPage
  };
  
  const { query, id, provincia, localidad } = params;
  
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
      const despacho = await buscarDespachoPorId(id);
      const response: BusquedaDespachosResponse = {
        data: despacho ? [despacho] : [],
        pagination: {
          page: 1,
          perPage: 1,
          total: despacho ? 1 : 0,
          totalPages: 1
        }
      };
      return NextResponse.json<BusquedaDespachosResponse>(response);
    }
    
    // Búsqueda por texto
    // Asegurarse de que query sea string (aunque ya tiene valor por defecto '')
    const searchQuery = query || '';
    let resultados = await buscarDespachosPorTexto(searchQuery);
    
    // Aplicar filtros si existen
    if (provincia || localidad) {
      resultados = resultados.filter((despacho) => {
        const sedes = despacho.meta?._despacho_sedes || [];
        
        // Si no hay sedes, no pasa ningún filtro
        if (!sedes.length || !sedes[0]) return false;
        
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
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const resultadosPaginados = resultados.slice(startIndex, endIndex);
    const total = resultados.length;
    const totalPages = Math.ceil(total / perPage);

    const response: BusquedaDespachosResponse = {
      data: resultadosPaginados,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    };

    return NextResponse.json<BusquedaDespachosResponse>(response);
    
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
  
  const response = await fetch(wpUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [WordPress] Error en la búsqueda:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data as DespachoWP;
}

/**
 * Busca despachos por texto en WordPress
 */
async function buscarDespachosPorTexto(query: string): Promise<DespachoWP[]> {
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
  
  if (!username || !appPassword) {
    throw new Error("Credenciales de WordPress no configuradas");
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const searchUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=50&_fields=id,title,content,meta`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10 segundos
    
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [WordPress] Error en la respuesta: ${response.status}`, errorText);
      throw new Error(`Error en la búsqueda: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('❌ [WordPress] Error en la búsqueda:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('La búsqueda tardó demasiado tiempo. Por favor, inténtalo de nuevo.');
      }
      
      if ('code' in error && error.code === 'UND_ERR_SOCKET') {
        throw new Error('Error de conexión con el servidor de WordPress. Por favor, verifica tu conexión a internet.');
      }
      
      throw new Error(`Error al buscar en WordPress: ${error.message}`);
    }
    
    throw new Error('Error desconocido al buscar en WordPress');
  }
}
