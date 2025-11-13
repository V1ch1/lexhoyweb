import { NextResponse } from "next/server";
import { SyncService } from "@/lib/syncService";

/**
 * Endpoint para sincronización bidireccional con WordPress
 * - Recibe webhooks DE WordPress (WP → Next.js)
 * - Envía cambios A WordPress (Next.js → WP)
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Caso 1: Sincronizar DESDE Next.js HACIA WordPress
    if (payload.despachoId && payload.objectId) {
      const result = await SyncService.enviarDespachoAWordPress(payload.despachoId);
      
      if (!result.success) {
        console.error('❌ Error al enviar a WordPress:', result.error);
        return NextResponse.json(
          { 
            status: 'error',
            error: result.error,
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          status: 'success',
          message: 'Despacho sincronizado con WordPress',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
    
    // Caso 2: Recibir webhook DESDE WordPress HACIA Next.js
    // Validar que tenemos los datos mínimos necesarios
    if (!payload || !payload.id) {
      console.error('❌ Payload inválido: falta ID');
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Payload inválido: se requiere ID del despacho',
        },
        { status: 400 }
      );
    }

    // Sincronizar el despacho usando SyncService
    const result = await SyncService.sincronizarDesdeWebhook(payload);

    if (!result.success) {
      console.error('❌ Error en sincronización:', result.error);
      return NextResponse.json(
        { 
          status: 'error',
          error: result.error,
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        status: 'success',
        message: result.message,
        despachoId: result.despachoId,
        objectId: result.objectId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
