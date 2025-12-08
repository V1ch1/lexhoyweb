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

    // 1. Leads por especialidad
    const { data: leadsData } = await supabaseAdmin
      .from("leads")
      .select("especialidad, vendido, precio_base")
      .not("especialidad", "is", null);

    // Agrupar por especialidad
    const especialidadMap: {
      [key: string]: { total: number; vendidos: number; ingresos: number };
    } = {};

    leadsData?.forEach((lead) => {
      const esp = lead.especialidad || "General";
      if (!especialidadMap[esp]) {
        especialidadMap[esp] = { total: 0, vendidos: 0, ingresos: 0 };
      }
      especialidadMap[esp].total++;
      if (lead.vendido) {
        especialidadMap[esp].vendidos++;
        especialidadMap[esp].ingresos += lead.precio_base || 0;
      }
    });

    // Convertir a array y ordenar por total
    const byEspecialidad = Object.entries(especialidadMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        vendidos: data.vendidos,
        ingresos: Math.round(data.ingresos * 100) / 100,
        conversionRate:
          data.total > 0
            ? Math.round((data.vendidos / data.total) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    // 2. Leads por urgencia
    const { data: urgenciaData } = await supabaseAdmin
      .from("leads")
      .select("urgencia")
      .not("urgencia", "is", null);

    const urgenciaMap: { [key: string]: number } = {};
    urgenciaData?.forEach((lead) => {
      const urg = lead.urgencia || "media";
      urgenciaMap[urg] = (urgenciaMap[urg] || 0) + 1;
    });

    const byUrgencia = Object.entries(urgenciaMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // 3. Leads por estado
    const { data: estadoData } = await supabaseAdmin
      .from("leads")
      .select("estado");

    const estadoMap: { [key: string]: number } = {};
    estadoData?.forEach((lead) => {
      const est = lead.estado || "pendiente";
      estadoMap[est] = (estadoMap[est] || 0) + 1;
    });

    const byEstado = Object.entries(estadoMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    const leadsAnalytics = {
      byEspecialidad,
      byUrgencia,
      byEstado,
    };

    return NextResponse.json(leadsAnalytics);
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_LEADS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
