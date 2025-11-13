import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PUT /api/despachos/[id]/verificacion
 * Cambia el estado de verificación de un despacho
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
    if (!['pendiente', 'verificado', 'rechazado'].includes(estado_verificacion)) {
      return NextResponse.json(
        { success: false, error: 'Estado de verificación inválido' },
        { status: 400 }
      );
    }

    // Actualizar verificación en Supabase
    const { error: updateError } = await supabase
      .from('despachos')
      .update({ estado_verificacion })
      .eq('id', despachoId);

    if (updateError) {
      console.error('❌ Error al actualizar Supabase:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar en base de datos' },
        { status: 500 }
      );
    }

    // Sincronizar con WordPress
    try {
      const { SyncService } = await import('@/lib/syncService');
      await SyncService.enviarDespachoAWordPress(despachoId, false);
      } catch (syncError) {
      console.error('⚠️ Error al sincronizar con WordPress:', syncError);
      // No fallar la petición si la sincronización falla
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación actualizada correctamente',
      estado_verificacion
    });

  } catch (error) {
    console.error('❌ Error al cambiar verificación:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
