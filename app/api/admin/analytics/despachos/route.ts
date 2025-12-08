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
    const { data: user, error: userError} = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Obtener leads vendidos con información del comprador
    const { data: leadsVendidos } = await supabaseAdmin
      .from("leads")
      .select(`
        id,
        precio_base,
        comprador_id,
        created_at
      `)
      .eq("vendido", true)
      .not("comprador_id", "is", null);

    // Obtener información de los compradores (despachos)
    const compradorIds = [...new Set(leadsVendidos?.map((l) => l.comprador_id))];
    
    const { data: usuarios } = await supabaseAdmin
      .from("users")
      .select("id, nombre, despacho_id")
      .in("id", compradorIds);

    const { data: despachos } = await supabaseAdmin
      .from("despachos")
      .select("id, nombre, ciudad, provincia");

    // Mapear despachos
    const despachoMap = new Map(despachos?.map((d) => [d.id, d]));
    const usuarioMap = new Map(usuarios?.map((u) => [u.id, u]));

    // Agrupar por despacho
    const despachoStats: {
      [key: string]: {
        nombre: string;
        ciudad: string;
        provincia: string;
        compras: number;
        gastado: number;
      };
    } = {};

    leadsVendidos?.forEach((lead) => {
      const usuario = usuarioMap.get(lead.comprador_id);
      if (!usuario || !usuario.despacho_id) return;

      const despacho = despachoMap.get(usuario.despacho_id);
      if (!despacho) return;

      const key = despacho.id;
      if (!despachoStats[key]) {
        despachoStats[key] = {
          nombre: despacho.nombre,
          ciudad: despacho.ciudad || "N/A",
          provincia: despacho.provincia || "N/A",
          compras: 0,
          gastado: 0,
        };
      }

      despachoStats[key].compras++;
      despachoStats[key].gastado += lead.precio_base || 0;
    });

    // Convertir a array y ordenar
    const topDespachos = Object.values(despachoStats)
      .map((d) => ({
        ...d,
        gastado: Math.round(d.gastado * 100) / 100,
      }))
      .sort((a, b) => b.compras - b.compras)
      .slice(0, 10);

    // Distribución geográfica de usuarios
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id");

    const { data: allDespachos } = await supabaseAdmin
      .from("despachos")
      .select("provincia");

    const provinciaMap: { [key: string]: number } = {};
    allDespachos?.forEach((d) => {
      const prov = d.provincia || "Sin especificar";
      provinciaMap[prov] = (provinciaMap[prov] || 0) + 1;
    });

    const byProvincia = Object.entries(provinciaMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const despachosAnalytics = {
      topDespachos,
      byProvincia,
    };

    return NextResponse.json(despachosAnalytics);
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_DESPACHOS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
