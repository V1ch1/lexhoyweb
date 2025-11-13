import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/syncService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PUT /api/despachos/[id]/estado
 * Cambia el estado de publicación de un despacho
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;
    const { estado } = await request.json();

    // Validar estado
    if (!['publish', 'draft', 'trash'].includes(estado)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // 1. Actualizar estado en Supabase
    const { error: updateError } = await supabase
      .from('despachos')
      .update({ estado_publicacion: estado })
      .eq('id', despachoId);

    if (updateError) {
      console.error('❌ Error al actualizar Supabase:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar en base de datos' },
        { status: 500 }
      );
    }

    // 2. Sincronizar con WordPress (forzando el nuevo estado)
    const wpResult = await SyncService.enviarDespachoAWordPress(despachoId, true);

    if (!wpResult.success) {
      console.warn('⚠️ Error al sincronizar con WordPress:', wpResult.error);
      // No fallar si WordPress falla, el cambio ya está en Supabase
      return NextResponse.json({
        success: true,
        message: 'Estado actualizado en base de datos, pero falló la sincronización con WordPress',
        wpError: wpResult.error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Estado actualizado correctamente',
      estado: estado
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
