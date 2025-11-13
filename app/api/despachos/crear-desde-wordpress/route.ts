import { NextResponse } from "next/server";

/**
 * Endpoint para obtener y sincronizar un despacho desde WordPress
 * Se usa cuando un usuario solicita vinculación a un despacho que no existe en nuestra BD
 * Obtiene los datos completos desde WordPress (incluyendo sedes) y los importa
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { objectId } = body;

    if (!objectId) {
      return NextResponse.json(
        { error: "Falta objectId" },
        { status: 400 }
      );
    }

    // 1. Obtener el despacho completo desde WordPress (incluye sedes en meta._despacho_sedes)
    // El objectId puede ser numérico o con formato lexhoy-XXXXX
    const wpId = objectId.toString().replace('lexhoy-', '');
    const wpUrl = `https://lexhoy.com/wp-json/wp/v2/despacho/${wpId}`;
    const wpResponse = await fetch(wpUrl);
    
    if (!wpResponse.ok) {
      console.error('❌ Error obteniendo despacho de WordPress:', wpResponse.status);
      return NextResponse.json(
        { error: "Despacho no encontrado en WordPress" },
        { status: 404 }
      );
    }

    const despachoWP = await wpResponse.json();
    // 2. Importar usando SyncService (que maneja despacho + sedes)
    const { SyncService } = await import('@/lib/syncService');
    const result = await SyncService.importarDespachoDesdeWordPress(despachoWP);

    if (!result.success) {
      console.error('❌ Error importando despacho:', result.error);
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
    console.error('❌ Error interno:', error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
