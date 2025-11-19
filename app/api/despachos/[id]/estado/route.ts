import { NextResponse } from "next/server";
import { SyncOrchestrator } from "@/lib/sync";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PUT /api/despachos/[id]/estado
 * Cambia el estado de publicación usando el nuevo sistema modular
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;
    const { estado } = await request.json();

    // Validar estado
    if (!["publish", "draft", "trash"].includes(estado)) {
      return NextResponse.json(
        { success: false, error: "Estado inválido" },
        { status: 400 }
      );
    }

    // 1. Actualizar estado en Supabase
    const { error: updateError } = await supabase
      .from("despachos")
      .update({
        estado_publicacion: estado,
        status: estado === "publish" ? "active" : "inactive",
      })
      .eq("id", despachoId);

    if (updateError) {
      console.error("❌ Error al actualizar Supabase:", updateError);
      return NextResponse.json(
        { success: false, error: "Error al actualizar en base de datos" },
        { status: 500 }
      );
    }

    // 2. Sincronizar completo usando el nuevo sistema modular
    const syncResult = await SyncOrchestrator.sincronizarCompleto(despachoId, true);

    if (!syncResult.success) {
      console.warn("⚠️ Error en sincronización:", syncResult.error);
    } else {
      console.log("✅ Sincronización completa exitosa (Supabase → WordPress → Algolia)");
    }

    return NextResponse.json({
      success: true,
      message: "Estado actualizado correctamente",
      estado: estado,
      wordpressId: syncResult.wordpressId,
      objectId: syncResult.objectId,
    });
  } catch (error) {
    console.error("❌ Error al cambiar estado:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
