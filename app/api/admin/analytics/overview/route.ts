import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
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

    // Obtener fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Obtener fecha de hace 60 días (para comparar tendencias)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 1. Total de usuarios
    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Usuarios activos (últimos 30 días)
    const { count: activeUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_sign_in_at", thirtyDaysAgo.toISOString());

    // 3. Total de despachos
    const { count: totalDespachos } = await supabaseAdmin
      .from("despachos")
      .select("*", { count: "exact", head: true });

    // 4. Total de leads
    const { count: totalLeads } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true });

    // 5. Leads vendidos
    const { count: leadsVendidos } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("vendido", true);

    // 6. Ingresos totales (suma de precios de leads vendidos)
    const { data: leadsConPrecio } = await supabaseAdmin
      .from("leads")
      .select("precio_base")
      .eq("vendido", true)
      .not("precio_base", "is", null);

    const totalRevenue = leadsConPrecio?.reduce(
      (sum, lead) => sum + (lead.precio_base || 0),
      0
    ) || 0;

    // 7. Calcular tendencias (comparar con mes anterior)
    // Usuarios nuevos últimos 30 días vs 30-60 días atrás
    const { count: usersLast30 } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: usersPrevious30 } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());

    // Despachos nuevos
    const { count: despachosLast30 } = await supabaseAdmin
      .from("despachos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: despachosPrevious30 } = await supabaseAdmin
      .from("despachos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());

    // Leads nuevos
    const { count: leadsLast30 } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: leadsPrevious30 } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());

    // Ingresos últimos 30 días
    const { data: revenueLast30Data } = await supabaseAdmin
      .from("leads")
      .select("precio_base")
      .eq("vendido", true)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .not("precio_base", "is", null);

    const revenueLast30 = revenueLast30Data?.reduce(
      (sum, lead) => sum + (lead.precio_base || 0),
      0
    ) || 0;

    const { data: revenuePrevious30Data } = await supabaseAdmin
      .from("leads")
      .select("precio_base")
      .eq("vendido", true)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())
      .not("precio_base", "is", null);

    const revenuePrevious30 = revenuePrevious30Data?.reduce(
      (sum, lead) => sum + (lead.precio_base || 0),
      0
    ) || 0;

    // Calcular porcentajes de cambio
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Calcular tasa de conversión
    const conversionRate = totalLeads && totalLeads > 0
      ? ((leadsVendidos || 0) / totalLeads) * 100
      : 0;

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalDespachos: totalDespachos || 0,
      totalLeads: totalLeads || 0,
      leadsVendidos: leadsVendidos || 0,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      trends: {
        users: Math.round(calculateTrend(usersLast30 || 0, usersPrevious30 || 0) * 10) / 10,
        despachos: Math.round(calculateTrend(despachosLast30 || 0, despachosPrevious30 || 0) * 10) / 10,
        leads: Math.round(calculateTrend(leadsLast30 || 0, leadsPrevious30 || 0) * 10) / 10,
        revenue: Math.round(calculateTrend(revenueLast30, revenuePrevious30) * 10) / 10,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_OVERVIEW]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
