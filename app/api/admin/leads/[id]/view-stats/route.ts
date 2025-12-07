import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    // Verificar rol de admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;

    // Obtener todas las visualizaciones con información de despachos y usuarios
    const { data: views, error } = await supabaseAdmin
      .from("lead_views")
      .select(`
        id,
        viewed_at,
        despacho_id,
        despachos (
          nombre
        ),
        user_id,
        users (
          nombre,
          email
        )
      `)
      .eq("lead_id", id)
      .order("viewed_at", { ascending: false });

    if (error) {
      console.error("Error fetching view stats:", error);
      return new NextResponse("Error fetching stats", { status: 500 });
    }

    // Agrupar por despacho
    const byDespacho: Record<string, any> = {};
    
    views?.forEach((view: any) => {
      const key = view.despacho_id || "sin_despacho";
      if (!byDespacho[key]) {
        byDespacho[key] = {
          despacho_id: view.despacho_id,
          despacho_nombre: view.despachos?.nombre || "Sin despacho asignado",
          count: 0,
          last_viewed: view.viewed_at,
          first_viewed: view.viewed_at,
        };
      }
      byDespacho[key].count++;
      // Actualizar primera visualización (la más antigua)
      if (new Date(view.viewed_at) < new Date(byDespacho[key].first_viewed)) {
        byDespacho[key].first_viewed = view.viewed_at;
      }
    });

    // Contar despachos únicos (excluyendo "sin_despacho")
    const uniqueDespachos = Object.keys(byDespacho).filter(
      (key) => key !== "sin_despacho"
    ).length;

    return NextResponse.json({
      total_views: views?.length || 0,
      unique_despachos: uniqueDespachos,
      by_despacho: Object.values(byDespacho).sort((a: any, b: any) => b.count - a.count),
      recent_views: views?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error("[VIEW_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
