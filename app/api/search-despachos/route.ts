import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const id = searchParams.get("id");
  
  console.log('🔍 Búsqueda de despacho:', { query, id });
  
  if (!query && !id) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    // Si busca por ID, ir directo a WordPress para obtener datos completos
    if (id) {
      console.log('🌐 Buscando por ID en WordPress...');
      const username = process.env.NEXT_PUBLIC_WP_USER;
      const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
      
      if (!username || !appPassword) {
        console.error('❌ Faltan credenciales de WordPress');
        return NextResponse.json(
          { error: "Credenciales de WordPress no configuradas" },
          { status: 500 }
        );
      }

      const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
      const wpUrl = `https://lexhoy.com/wp-json/wp/v2/despacho/${id}`;
      console.log('🔗 URL WordPress:', wpUrl);
      
      const wpRes = await fetch(wpUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log('📡 Respuesta WordPress:', wpRes.status, wpRes.statusText);
      
      if (!wpRes.ok) {
        const errorText = await wpRes.text();
        console.error('❌ Error WordPress:', errorText);
        return NextResponse.json([], { status: 200 });
      }
      
      const despacho = await wpRes.json();
      console.log('✅ Despacho encontrado en WordPress:', despacho.id);
      return NextResponse.json([despacho], { status: 200 });
    }

    // 1. Para búsquedas por texto, primero buscar en Next.js (Supabase)
    console.log('📊 Buscando en Next.js/Supabase...');
    const { data: despachosLocal, error: localError } = await supabase
      .from('despachos')
      .select('*')
      .or(`nombre.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(10);

    if (!localError && despachosLocal && despachosLocal.length > 0) {
      console.log(`✅ Encontrados ${despachosLocal.length} despachos en Next.js`);
      
      // Convertir formato de Supabase a formato WordPress para compatibilidad
      const despachosFormateados = despachosLocal.map(d => ({
        id: d.object_id || d.id,
        title: { rendered: d.nombre },
        meta: {
          localidad: '',
          provincia: '',
          object_id: d.object_id,
          slug: d.slug,
        }
      }));
      
      return NextResponse.json(despachosFormateados, { status: 200 });
    }

    // 2. Si no se encuentra en Next.js, buscar en WordPress
    console.log('🌐 Buscando en WordPress...');
    const username = process.env.NEXT_PUBLIC_WP_USER;
    const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
    
    if (!username || !appPassword) {
      console.error('❌ Faltan credenciales de WordPress');
      return NextResponse.json(
        { error: "Credenciales de WordPress no configuradas" },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const wpUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=10`;
    console.log('🔗 URL WordPress:', wpUrl);
    
    const wpRes = await fetch(wpUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log('📡 Respuesta WordPress:', wpRes.status, wpRes.statusText);
    
    if (!wpRes.ok) {
      const errorText = await wpRes.text();
      console.error('❌ Error WordPress:', errorText);
      return NextResponse.json(
        { error: "Error consultando WordPress", details: errorText },
        { status: 500 }
      );
    }
    
    const data = await wpRes.json();
    console.log(`✅ Encontrados ${data.length} despachos en WordPress`);
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    return NextResponse.json(
      { 
        error: "Error interno",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
