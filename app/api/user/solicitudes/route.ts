import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obtener solicitudes del usuario
    const { data: solicitudes, error } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha_solicitud", { ascending: false });

    if (error) {
      console.error("Error obteniendo solicitudes:", error);
      return NextResponse.json(
        { error: "Error al obtener solicitudes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      solicitudes: solicitudes || [],
    });
  } catch (error) {
    console.error("Error en GET /api/user/solicitudes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
