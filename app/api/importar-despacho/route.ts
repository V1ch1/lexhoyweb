import { NextResponse } from "next/server";
import { SyncService } from "@/lib/syncService";

/**
 * Endpoint para importar un despacho desde WordPress a Next.js
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { despachoWP } = body;

    if (!despachoWP || !despachoWP.id) {
      return NextResponse.json(
        { error: "Datos del despacho inválidos" },
        { status: 400 }
      );
    }

    console.log('📥 Importando despacho:', despachoWP.id);

    // Importar usando SyncService
    const result = await SyncService.importarDespachoDesdeWordPress(despachoWP);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      despachoId: result.despachoId,
      objectId: result.objectId,
      message: result.message,
    });

  } catch (error) {
    console.error('❌ Error al importar despacho:', error);
    console.error('Tipo de error:', typeof error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    let errorMessage = 'Error desconocido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      {
        error: 'Error al importar despacho',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
