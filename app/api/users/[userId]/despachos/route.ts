import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    console.log("🔍 [API /users/[userId]/despachos] Solicitud recibida para userId:", userId);

    // Verificar autenticación
    const { user, error: authError } = await requireAuth();
    if (authError) {
      console.error("❌ [API /users/[userId]/despachos] Error de autenticación");
      return authError;
    }

    console.log("✅ [API /users/[userId]/despachos] Usuario autenticado:", user.id);

    // Verificar que el usuario está solicitando sus propios despachos
    if (user.id !== userId) {
      console.error("❌ [API /users/[userId]/despachos] Usuario intenta acceder a despachos de otro usuario");
      return NextResponse.json(
        { error: "No autorizado para ver despachos de otro usuario" },
        { status: 403 }
      );
    }

    if (!userId) {
      console.error("❌ [API /users/[userId]/despachos] User ID no proporcionado");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      // 1. Primero, obtener los despachos asociados al usuario
      console.log("📊 [API /users/[userId]/despachos] Consultando user_despachos...");
      const { data: userDespachos, error: userDespachosError } = await supabase
        .from("user_despachos")
        .select("id, despacho_id, fecha_asignacion")
        .eq("user_id", userId)
        .eq("activo", true);

      if (userDespachosError) {
        console.error("❌ [API /users/[userId]/despachos] Error al obtener user_despachos:", userDespachosError);
        throw userDespachosError;
      }

      console.log(`📊 [API /users/[userId]/despachos] Encontrados ${userDespachos?.length || 0} despachos asignados`);

      // Si no hay despachos, devolver array vacío
      if (!userDespachos || userDespachos.length === 0) {
        console.log("ℹ️ [API /users/[userId]/despachos] No hay despachos asignados, devolviendo array vacío");
        return NextResponse.json([]);
      }

      // 2. Obtener los IDs de los despachos
      const despachoIds = userDespachos.map((ud) => ud.despacho_id);
      console.log("📊 [API /users/[userId]/despachos] IDs de despachos:", despachoIds);

      // 3. Obtener los detalles de los despachos
      const { data: despachos, error: despachosError } = await supabase
        .from("despachos")
        .select("*")
        .in("id", despachoIds);

      if (despachosError) {
        console.error("❌ [API /users/[userId]/despachos] Error al obtener los despachos:", despachosError);
        throw despachosError;
      }

      console.log(`📊 [API /users/[userId]/despachos] Encontrados ${despachos?.length || 0} despachos en la tabla despachos`);

      // 4. Contar las sedes activas de cada despacho
      const sedesCount: Record<string, number> = {};
      for (const despachoId of despachoIds) {
        const { count, error: countError } = await supabase
          .from("sedes")
          .select("*", { count: "exact", head: true })
          .eq("despacho_id", despachoId)
          .eq("activa", true);

        if (!countError) {
          sedesCount[despachoId] = count || 0;
        } else {
          sedesCount[despachoId] = 0;
        }
      }

      // 5. Transformar los datos para que coincidan con la interfaz esperada
      // IMPORTANTE: Filtrar solo despachos que existen realmente
      const transformedDespachos = userDespachos
        .map((ud) => {
          const despacho = despachos.find((d) => d.id === ud.despacho_id);

          // Si el despacho no existe en la tabla, retornar null
          if (!despacho) {
            console.warn(
              `⚠️ [API /users/[userId]/despachos] Despacho ${ud.despacho_id} asignado al usuario pero no existe en tabla despachos`
            );
            return null;
          }

          return {
            id: ud.despacho_id,
            nombre: despacho.nombre || despacho.slug || "Despacho sin nombre",
            localidad: despacho.localidad || "",
            provincia: despacho.provincia || "",
            telefono: despacho.telefono || "",
            email: despacho.email || "",
            web: despacho.web || "",
            descripcion: despacho.descripcion || "",
            num_sedes: sedesCount[ud.despacho_id] || 0, // Usar el conteo real de sedes activas
            estado: "verificado", // Asumimos que si está en la tabla, está verificado
            created_at: ud.fecha_asignacion || despacho.created_at,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null); // Filtrar nulls y asegurar tipo

      console.log(`✅ [API /users/[userId]/despachos] Devolviendo ${transformedDespachos.length} despachos transformados`);
      return NextResponse.json(transformedDespachos, { status: 200 });
    } catch (error) {
      console.error("❌ [API /users/[userId]/despachos] Error al consultar despachos:", error);
      // En caso de error, devolver array vacío
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("❌ [API /users/[userId]/despachos] Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error procesando la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
