import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    console.log("🔍 [API /mis-solicitudes] Solicitud recibida");

    // Obtener usuario autenticado con NextAuth
    const { user, error: userError } = await requireAuth();
    
    if (userError) {
      console.error("❌ [API /mis-solicitudes] Error de autenticación");
      return userError;
    }

    console.log("✅ [API /mis-solicitudes] Usuario autenticado:", user.id);

    // Crear cliente Supabase con Service Role para bypass RLS
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("📊 [API /mis-solicitudes] Consultando solicitudes_despacho...");

    // Obtener solicitudes del usuario
    const { data: solicitudes, error } = await supabase
      .from('solicitudes_despacho')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      console.error('❌ [API /mis-solicitudes] Error al consultar solicitudes:', error);
      return NextResponse.json(
        { error: "Error fetching solicitudes", details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API /mis-solicitudes] Encontradas ${solicitudes?.length || 0} solicitudes`);
    return NextResponse.json(solicitudes || [], { status: 200 });
    
  } catch (error) {
    console.error("❌ [API /mis-solicitudes] Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error fetching solicitudes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
