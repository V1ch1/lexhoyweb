import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UserService } from "@/lib/userService";

const userService = new UserService();

export async function POST(request: Request) {
  try {
    // Leer el JWT del header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Crear cliente Supabase con el token del usuario
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verificar que el usuario sea super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.rol !== "super_admin") {
      console.error("❌ Error de permisos:", { userError, userData });
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { solicitudId, notas } = body;

    if (!solicitudId) {
      return NextResponse.json(
        { error: "Falta el ID de la solicitud" },
        { status: 400 }
      );
    }

    // Aprobar la solicitud usando el servicio
    await userService.approveSolicitudDespacho(
      solicitudId,
      user.id,
      notas || "Solicitud aprobada"
    );

    return NextResponse.json({
      success: true,
      message: "Solicitud aprobada correctamente",
    });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);
    return NextResponse.json(
      {
        error: "Error al aprobar solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
