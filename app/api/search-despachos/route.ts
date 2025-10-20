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
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const offset = (page - 1) * perPage;
  
  console.log('🔍 Búsqueda de despacho:', { query, id });
  
  if (!query && !id) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    // Si busca por ID, ir directo a WordPress para obtener datos completos
    if (id) {
      console.log('🌐 Buscando por ID en WordPress...');
      const username = process.env.WORDPRESS_USERNAME;
      const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
      
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
    // Obtener el conteo total primero
    const { count } = await supabase
      .from('despachos')
      .select('*', { count: 'exact', head: true })
      .or(`nombre.ilike.%${query}%,slug.ilike.%${query}%`);

    // Obtener los datos paginados
    const { data: despachosLocal, error: localError } = await supabase
      .from('despachos')
      .select('*')
      .or(`nombre.ilike.%${query}%,slug.ilike.%${query}%`)
      .range(offset, offset + perPage - 1)
      .order('nombre');

    if (!localError && despachosLocal && despachosLocal.length > 0) {
      console.log(`✅ Encontrados ${despachosLocal.length} despachos en Next.js`);
      
      // Convertir formato de Supabase a formato WordPress para compatibilidad
      const despachosFormateados = despachosLocal.map(d => ({
        id: d.object_id || d.id,
        title: { rendered: d.nombre },
        content: { rendered: d.descripcion || '' },
        slug: d.slug,
        meta: {
          localidad: d.localidad || '',
          provincia: d.provincia || '',
          object_id: d.object_id,
          slug: d.slug,
          // Incluir sedes si existen
          _despacho_sedes: []
        },
        // Marcar que viene de Supabase para que no intente buscar en WordPress
        _fromSupabase: true,
        _supabaseId: d.id
      }));
      
      return NextResponse.json({
        data: despachosFormateados,
        pagination: {
          total: count || 0,
          page,
          perPage,
          totalPages: Math.ceil((count || 0) / perPage)
        }
      }, { status: 200 });
    }

    // 2. Si no se encuentra en Next.js, buscar en WordPress
    console.log('🌐 Buscando en WordPress...');
    const username = process.env.WORDPRESS_USERNAME;
    const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
    
    if (!username || !appPassword) {
      console.error('❌ Faltan credenciales de WordPress');
      return NextResponse.json(
        { error: "Credenciales de WordPress no configuradas" },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    
    // Primero obtenemos el conteo total
    const countUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=1`;
    const countRes = await fetch(countUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!countRes.ok) {
      const errorText = await countRes.text();
      console.error('❌ Error al contar resultados en WordPress:', errorText);
      return NextResponse.json(
        { error: "Error consultando WordPress", details: errorText },
        { status: 500 }
      );
    }
    
    // Obtener el total de resultados del header X-WP-Total
    const total = parseInt(countRes.headers.get('X-WP-Total') || '0');
    const totalPages = Math.ceil(total / perPage);
    
    // Ahora obtenemos los datos paginados con todos los campos necesarios
    const wpUrl = `https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&_fields=id,title,content,meta,slug&_embed=1`;
    
    console.log('🔗 URL completa de WordPress:', wpUrl);
    
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
    
    // Mostrar la estructura completa del primer elemento para depuración
    if (data.length > 0) {
      console.log('🔍 Primer despacho recibido de WordPress (estructura completa):', JSON.stringify(data[0], null, 2));
      console.log('🔍 Meta del primer despacho:', JSON.stringify(data[0]?.meta || {}, null, 2));
      if (data[0]?.meta?._despacho_sedes) {
        console.log('🏢 Sedes del primer despacho:', JSON.stringify(data[0].meta._despacho_sedes, null, 2));
      }
    }
    
    // Formatear la respuesta para que coincida con el formato de Supabase
    interface Sede {
      localidad?: string;
      provincia?: string;
      direccion?: string;
      codigo_postal?: string;
      telefono?: string;
      email?: string;
    }

    interface WordPressItem {
      id: string | number;
      title?: string | { rendered?: string };
      content?: string | { rendered?: string };
      slug?: string;
      meta?: {
        _despacho_sedes?: Sede[];
        localidad?: string;
        provincia?: string;
        email_contacto?: string;
        telefono?: string;
      };
      localidad?: string;
      provincia?: string;
      email_contacto?: string;
      telefono?: string;
    }
    
    const formattedData = data.map((item: WordPressItem) => {
      console.log('📦 Datos completos de WordPress:', JSON.stringify(item, null, 2));
      
      // Extraer las sedes si existen
      const sedes = item.meta?._despacho_sedes || [];
      const sedePrincipal = Array.isArray(sedes) && sedes.length > 0 ? sedes[0] : null;
      
      const title = typeof item.title === 'object' ? item.title.rendered : item.title;
      const content = typeof item.content === 'object' ? item.content.rendered : item.content;
      
      return {
        id: item.id,
        title: title,
        content: content,
        // Incluir campos directos para facilitar el acceso
        localidad: sedePrincipal?.localidad || item.meta?.localidad || '',
        provincia: sedePrincipal?.provincia || item.meta?.provincia || '',
        email_contacto: item.meta?.email_contacto || '',
        telefono: item.meta?.telefono || '',
        meta: {
          ...item.meta, // Incluir todos los metadatos
          localidad: sedePrincipal?.localidad || item.meta?.localidad || '',
          provincia: sedePrincipal?.provincia || item.meta?.provincia || '',
          object_id: item.id.toString(),
          slug: item.slug,
          _despacho_sedes: sedes,
          // Incluir datos de la sede principal directamente en meta para fácil acceso
          ...(sedePrincipal && {
            direccion: sedePrincipal.direccion,
            codigo_postal: sedePrincipal.codigo_postal,
            telefono: sedePrincipal.telefono,
            email: sedePrincipal.email
          })
        },
        _fromWordPress: true,
        _originalData: item // Guardar los datos originales para depuración
      };
    });
    
    return NextResponse.json({
      data: formattedData,
      pagination: {
        total,
        page,
        perPage,
        totalPages
      }
    }, { status: 200 });
    
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
