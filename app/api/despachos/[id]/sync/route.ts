import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/syncService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/despachos/[id]/sync
 * Sincroniza un despacho de Supabase a WordPress
 * WordPress luego actualiza Algolia via plugin
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;
    
    console.log('🔄 Iniciando sincronización para despacho:', despachoId);
    console.log('🔑 Usando Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔑 Service Role Key disponible:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. Verificar que el despacho existe
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select('id, nombre, slug, object_id')
      .eq('id', despachoId)
      .single();
    
    if (despachoError) {
      console.error('❌ Error de Supabase:', despachoError);
      console.error('❌ Código:', despachoError.code);
      console.error('❌ Mensaje:', despachoError.message);
    }
    
    if (despachoError || !despacho) {
      console.error('❌ Despacho no encontrado:', despachoId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Despacho no encontrado',
          details: despachoError?.message || 'No data returned',
          despachoId: despachoId
        },
        { status: 404 }
      );
    }
    
    console.log('📝 Despacho encontrado:', despacho.nombre);
    
    // 2. Sincronizar a WordPress
    const wpResult = await SyncService.enviarDespachoAWordPress(despachoId);
    
    if (!wpResult.success) {
      console.error('❌ Error al sincronizar con WordPress:', wpResult.error);
      
      // Guardar en cola para reintentar (si existe la tabla)
      try {
        await supabase.from('sync_queue').insert({
          tipo: 'wordpress',
          despacho_id: despachoId,
          accion: 'update',
          estado: 'fallido',
          ultimo_error: wpResult.error,
          proximo_intento_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // +2 minutos
        });
        console.log('📥 Tarea encolada para reintento');
      } catch (error) {
        console.warn('⚠️ No se pudo encolar (tabla sync_queue no existe aún):', error);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al sincronizar con WordPress',
          details: wpResult.error,
          enqueued: true
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Sincronización exitosa con WordPress');
    console.log('📝 Object ID:', wpResult.objectId);
    
    // 3. Actualizar estado de sincronización en Supabase
    await supabase
      .from('despachos')
      .update({
        sincronizado_wp: true,
        ultima_sincronizacion: new Date().toISOString()
      })
      .eq('id', despachoId);
    
    console.log('✅ Estado actualizado en Supabase');
    
    return NextResponse.json({
      success: true,
      message: 'Despacho sincronizado correctamente con WordPress',
      objectId: wpResult.objectId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
