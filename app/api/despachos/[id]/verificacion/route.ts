import { NextResponse } from "next/server";
import { SyncOrchestrator } from "@/lib/sync";

/**
 * PUT /api/despachos/[id]/verificacion
 * Cambia el estado de verificación de un despacho usando el nuevo sistema modular
 * Estados posibles: 'pendiente', 'verificado', 'rechazado'
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;
    const { estado_verificacion } = await request.json();

    // Validar que el estado sea válido
    if (
      !["pendiente", "verificado", "rechazado"].includes(estado_verificacion)
    ) {
      return NextResponse.json(
        { success: false, error: "Estado de verificación inválido" },
        { status: 400 }
      );
    }

    // Usar el nuevo sistema modular para actualizar y sincronizar
    const result = await SyncOrchestrator.actualizarVerificacion(
      despachoId,
      estado_verificacion
    );

    if (!result.success) {
      console.error("❌ Error en sincronización:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error al actualizar verificación",
          wordpressId: result.wordpressId,
          objectId: result.objectId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verificación actualizada correctamente",
      estado_verificacion,
      wordpressId: result.wordpressId,
      objectId: result.objectId,
    });
  } catch (error) {
    console.error("❌ Error al cambiar verificación:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
