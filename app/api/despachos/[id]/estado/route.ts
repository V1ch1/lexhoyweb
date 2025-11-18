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
      .update({ 
        estado_publicacion: estado,
        status: estado === 'publish' ? 'active' : 'inactive'
      })
      .eq('id', despachoId);

    if (updateError) {
      console.error('❌ Error al actualizar Supabase:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar en base de datos' },
        { status: 500 }
      );
    }

    // Obtener el object_id para Algolia
    const { data: despachoData } = await supabase
      .from('despachos')
      .select('object_id')
      .eq('id', despachoId)
      .single();

    // 2. Sincronizar con WordPress (forzando el nuevo estado)
    const wpResult = await SyncService.enviarDespachoAWordPress(despachoId, true);

    if (!wpResult.success) {
      console.warn('⚠️ Error al sincronizar con WordPress:', wpResult.error);
    }

    // 3. Sincronizar con Algolia
    if (despachoData?.object_id) {
      try {
        await SyncService.sincronizarConAlgolia(despachoId, despachoData.object_id);
        console.log('✅ Sincronizado con Algolia');
      } catch (algoliaError) {
        console.error('⚠️ Error al sincronizar con Algolia:', algoliaError);
      }
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
