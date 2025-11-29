import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/api-auth";

/**
 * GET /api/admin/solicitudes
 * Obtener TODAS las solicitudes de despacho del sistema (solo super admin)
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol de super admin
    const { user, error: authError } = await requireSuperAdmin();

    if (authError) {
      return authError;
    }

    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obtener parámetros de búsqueda opcionales
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado"); // pendiente, aprobado, rechazado, cancelada
    const search = searchParams.get("search"); // búsqueda por nombre o despacho

    // Construir query - Los datos ya están desnormalizados en la tabla
    let query = supabase
      .from("solicitudes_despacho")
      .select("*")
      .order("fecha_solicitud", { ascending: false });

    // Aplicar filtros si existen
    if (estado && ["pendiente", "aprobado", "rechazado", "cancelada"].includes(estado)) {
      query = query.eq("estado", estado);
    }

    if (search && search.trim()) {
      // Búsqueda por nombre de usuario o nombre de despacho
      query = query.or(
        `user_name.ilike.%${search}%,despacho_nombre.ilike.%${search}%`
      );
    }

    const { data: solicitudes, error } = await query;

    if (error) {
      console.error("Error obteniendo solicitudes:", error);
      return NextResponse.json(
        { error: "Error al obtener solicitudes", details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Solicitudes encontradas: ${solicitudes?.length || 0}`);

    // Formatear respuesta con información completa
    const solicitudesFormateadas = solicitudes?.map((sol) => ({
      id: sol.id,
      user_id: sol.user_id,
      user_name: sol.user_name,
      user_email: sol.user_email,
      despacho_id: sol.despacho_id,
      despacho_nombre: sol.despacho_nombre,
      despacho_localidad: sol.despacho_localidad,
      despacho_provincia: sol.despacho_provincia,
      estado: sol.estado,
      fecha_solicitud: sol.fecha_solicitud,
      fecha_respuesta: sol.fecha_respuesta,
      notas_respuesta: sol.notas_respuesta,
    })) || [];

    return NextResponse.json({
      solicitudes: solicitudesFormateadas,
      total: solicitudesFormateadas.length,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/solicitudes:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
