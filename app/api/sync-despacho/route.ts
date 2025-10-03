import { NextResponse } from "next/server";
import { SyncService } from "@/lib/syncService";

/**
 * Endpoint para recibir webhooks de WordPress
 * Sincroniza despachos y sedes automáticamente
 */
export async function POST(request: Request) {
  try {
    console.log('\n===== WEBHOOK DE WORDPRESS =====');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Obtener el payload del webhook
    const payload = await request.json();
    console.log('Payload recibido:', JSON.stringify(payload, null, 2));
    
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
    console.log(`🔄 Sincronizando despacho ID: ${payload.id}`);
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

    console.log('✅ Sincronización exitosa');
    console.log(`Despacho ID: ${result.despachoId}`);
    console.log(`Object ID: ${result.objectId}`);
    
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
