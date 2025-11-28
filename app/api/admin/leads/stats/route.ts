import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
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

    // Total de leads
    const { count: totalLeads } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true });

    // Leads pendientes de aprobar
    const { count: pendientes } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente");

    // Leads procesados sin aprobar
    const { count: procesadosSinAprobar } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "procesado")
      .is("aprobado_por", null);

    // Leads en subasta
    const { count: enSubasta } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "en_subasta");

    // Leads vendidos (total)
    const { count: vendidosTotal } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "vendido");

    // Leads vendidos este mes
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);

    const { count: vendidosMes } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "vendido")
      .gte("fecha_venta", primerDiaMes.toISOString());

    // Ingresos totales
    const { data: ventasData } = await supabaseAdmin
      .from("leads")
      .select("precio_venta")
      .eq("estado", "vendido")
      .not("precio_venta", "is", null);

    const ingresosTotal = ventasData?.reduce(
      (sum, lead) => sum + (lead.precio_venta || 0),
      0
    ) || 0;

    // Ingresos este mes
    const { data: ventasMesData } = await supabaseAdmin
      .from("leads")
      .select("precio_venta")
      .eq("estado", "vendido")
      .gte("fecha_venta", primerDiaMes.toISOString())
      .not("precio_venta", "is", null);

    const ingresosMes = ventasMesData?.reduce(
      (sum, lead) => sum + (lead.precio_venta || 0),
      0
    ) || 0;

    // Precio promedio de venta
    const precioPromedio = vendidosTotal && vendidosTotal > 0
      ? ingresosTotal / vendidosTotal
      : 0;

    // Leads descartados
    const { count: descartados } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "descartado");

    return NextResponse.json({
      totalLeads: totalLeads || 0,
      pendientes: pendientes || 0,
      procesadosSinAprobar: procesadosSinAprobar || 0,
      enSubasta: enSubasta || 0,
      vendidosTotal: vendidosTotal || 0,
      vendidosMes: vendidosMes || 0,
      descartados: descartados || 0,
      ingresosTotal,
      ingresosMes,
      precioPromedio,
    });
  } catch (error) {
    console.error("[ADMIN_LEADS_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
