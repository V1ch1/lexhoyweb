import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
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

    // Obtener parámetro de días (por defecto 30)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Usuarios por día
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // 2. Leads por día
    const { data: leadsData } = await supabaseAdmin
      .from("leads")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // 3. Ventas por día
    const { data: salesData } = await supabaseAdmin
      .from("leads")
      .select("created_at, precio_base")
      .eq("vendido", true)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Función para agrupar por día
    const groupByDay = (data: any[], dateField = "created_at") => {
      const grouped: { [key: string]: number } = {};
      
      // Inicializar todos los días con 0
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        const dateStr = date.toISOString().split("T")[0];
        grouped[dateStr] = 0;
      }

      // Contar elementos por día
      data?.forEach((item) => {
        const date = new Date(item[dateField]).toISOString().split("T")[0];
        if (grouped[date] !== undefined) {
          grouped[date]++;
        }
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        count,
      }));
    };

    // Función para agrupar ingresos por día
    const groupRevenueByDay = (data: any[]) => {
      const grouped: { [key: string]: number } = {};
      
      // Inicializar todos los días con 0
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        const dateStr = date.toISOString().split("T")[0];
        grouped[dateStr] = 0;
      }

      // Sumar ingresos por día
      data?.forEach((item) => {
        const date = new Date(item.created_at).toISOString().split("T")[0];
        if (grouped[date] !== undefined) {
          grouped[date] += item.precio_base || 0;
        }
      });

      return Object.entries(grouped).map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      }));
    };

    const chartData = {
      dailyUsers: groupByDay(usersData || []),
      dailyLeads: groupByDay(leadsData || []),
      dailySales: groupByDay(salesData || []),
      dailyRevenue: groupRevenueByDay(salesData || []),
    };

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_CHARTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
