import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca despachos en WordPress
 * GET /api/despachos/wordpress/buscar?query=...&id=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const id = searchParams.get("id");
  
  console.log('🔍 [WordPress] Búsqueda de despacho:', { query, id });
  
  if (!query && !id) {
    return NextResponse.json(
      { error: "Se requiere un término de búsqueda o un ID" },
      { status: 400 }
    );
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
    return NextResponse.json(resultados);
    
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
