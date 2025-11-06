import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

// GET - Listar entradas en proyecto
// Las RLS policies de Supabase se encargan de la seguridad
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "9");

    // Construir query - RLS se encarga de filtrar según permisos
    let query = supabase
      .from("entradas_proyecto")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filtrar por estado si se especifica
    if (estado) {
      query = query.eq("estado", estado);
    }

    // Paginación
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: entradas, error, count } = await query;

    if (error) {
      console.error("Error al obtener entradas:", error);
      return NextResponse.json(
        { error: "Error al obtener entradas" },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / perPage) : 0;

    return NextResponse.json({
      success: true,
      entradas: entradas || [],
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/marketing/entradas-proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva entrada (solo super_admin)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("sb-access-token");

    if (!authCookie) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authCookie.value
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no válido" },
        { status: 401 }
      );
    }

    // Verificar que sea super_admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rol, name, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Error al obtener datos del usuario" },
        { status: 500 }
      );
    }

    if (userData.rol !== "super_admin") {
      return NextResponse.json(
        { error: "No tienes permisos para crear entradas" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { titulo, descripcion, imagen_url, estado = "borrador" } = body;

    // Validaciones
    if (!titulo || titulo.trim().length < 3) {
      return NextResponse.json(
        { error: "El título debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (!descripcion || descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: "La descripción debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    // Crear entrada
    const { data: entrada, error: insertError } = await supabase
      .from("entradas_proyecto")
      .insert({
        user_id: user.id,
        user_name: userData.name,
        user_email: userData.email,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagen_url: imagen_url || null,
        estado,
        published_at: estado === "publicada" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error al crear entrada:", insertError);
      return NextResponse.json(
        { error: "Error al crear la entrada" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entrada,
      message: "Entrada creada exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /api/marketing/entradas-proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
