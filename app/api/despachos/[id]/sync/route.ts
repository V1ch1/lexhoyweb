import { NextResponse } from "next/server";
import { SyncOrchestrator } from "@/lib/sync";
import { SupabaseSync } from "@/lib/sync/supabase";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/despachos/[id]/sync
 * Sincroniza un despacho completo usando el nuevo sistema modular
 * Supabase → WordPress → Algolia
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;

    // 1. Verificar que el despacho existe
    const { data: despacho, error: despachoError } = await supabase
      .from("despachos")
      .select("id, nombre, slug, object_id")
      .eq("id", despachoId)
      .single();

    if (despachoError) {
      console.error("❌ Error de Supabase:", despachoError);
      console.error("❌ Código:", despachoError.code);
      console.error("❌ Mensaje:", despachoError.message);
    }

    if (despachoError || !despacho) {
      console.error("❌ Despacho no encontrado:", despachoId);
      return NextResponse.json(
        {
          success: false,
          error: "Despacho no encontrado",
          details: despachoError?.message || "No data returned",
          despachoId: despachoId,
        },
        { status: 404 }
      );
    }

    // 2. Sincronizar usando el nuevo sistema modular
    const result = await SyncOrchestrator.sincronizarCompleto(
      despachoId,
      false
    );

    if (!result.success) {
      console.error("❌ Error en sincronización:", result.error);

      // Guardar en cola para reintentar (si existe la tabla)
      try {
        await supabase.from("sync_queue").insert({
          tipo: "completo",
          despacho_id: despachoId,
          accion: "sync",
          estado: "fallido",
          ultimo_error: result.error,
          proximo_intento_at: new Date(
            Date.now() + 2 * 60 * 1000
          ).toISOString(), // +2 minutos
        });
      } catch (error) {
        console.warn(
          "⚠️ No se pudo encolar (tabla sync_queue no existe aún):",
          error
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Error en sincronización completa",
          details: result.error,
          enqueued: true,
        },
        { status: 500 }
      );
    }

    // 3. Los IDs ya se actualizan automáticamente en SyncOrchestrator
    console.log("✅ Sincronización completa exitosa");

    return NextResponse.json({
      success: true,
      message:
        "Despacho sincronizado correctamente (Supabase → WordPress → Algolia)",
      wordpressId: result.wordpressId,
      objectId: result.objectId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
