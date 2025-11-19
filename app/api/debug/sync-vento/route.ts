import { NextResponse } from "next/server";
import { SyncOrchestrator } from "@/lib/sync";

/**
 * POST /api/debug/sync-vento
 * Fuerza la sincronización completa del despacho Vento usando el nuevo sistema modular
 */
export async function POST() {
  const VENTO_ID = "33792fd3-4f9a-412a-a399-c10f63c675f9";

  try {
    // Usar el nuevo orchestrator modular
    const result = await SyncOrchestrator.sincronizarCompleto(VENTO_ID, false);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          wordpressId: result.wordpressId,
          objectId: result.objectId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vento sincronizado correctamente con el nuevo sistema",
      wordpressId: result.wordpressId,
      objectId: result.objectId,
    });
  } catch (error) {
    console.error("❌ Error al sincronizar Vento:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
