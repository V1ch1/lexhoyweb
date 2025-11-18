import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obtener total de usuarios
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Obtener usuarios por rol
    const { data: users } = await supabase.from("users").select("rol");

    const usersByRole = {
      super_admin: users?.filter((u) => u.rol === "super_admin").length || 0,
      despacho_admin:
        users?.filter((u) => u.rol === "despacho_admin").length || 0,
      usuario: users?.filter((u) => u.rol === "usuario").length || 0,
    };

    // Obtener total de despachos en Supabase (importados desde WordPress)
    const { count: supabaseDespachos } = await supabase
      .from("despachos")
      .select("*", { count: "exact", head: true });

    // Obtener despachos nuevos (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: newDespachos } = await supabase
      .from("despachos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Obtener total de leads
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      supabaseDespachos: supabaseDespachos || 0,
      newDespachos: newDespachos || 0,
      totalLeads: totalLeads || 0,
      usersByRole,
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
