import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Leer el JWT del header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Crear cliente Supabase con Service Role para bypass RLS
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('📊 Obteniendo solicitudes para usuario:', userId);

    // Obtener solicitudes del usuario
    const { data: solicitudes, error } = await supabase
      .from('solicitudes_despacho')
      .select('*')
      .eq('user_id', userId)
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      console.error('❌ Error al consultar solicitudes:', error);
      return NextResponse.json(
        { error: "Error fetching solicitudes", details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Solicitudes encontradas:', solicitudes?.length || 0);

    return NextResponse.json(solicitudes || [], { status: 200 });
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error fetching solicitudes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
