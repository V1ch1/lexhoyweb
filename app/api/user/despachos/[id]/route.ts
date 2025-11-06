import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * DELETE - Desasignar usuario de un despacho
 * No elimina el despacho, solo quita la relación del usuario
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await params;

    console.log('🔓 Desasignando usuario del despacho:', despachoId);

    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el despacho existe
    console.log('🔍 Buscando despacho con ID:', despachoId);
    
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select('id, nombre, owner_email')
      .eq('id', despachoId)
      .single();

    console.log('📊 Resultado búsqueda despacho:', { despacho, despachoError });

    if (despachoError || !despacho) {
      console.error('❌ Despacho no encontrado:', despachoError);
      return NextResponse.json(
        { error: 'Despacho no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ Despacho encontrado:', despacho.nombre);

    // Verificar que el usuario está asignado al despacho
    console.log('🔍 Buscando relación user_despachos:', { user_id: user.id, despacho_id: despachoId });
    
    const { data: userDespacho, error: checkError } = await supabase
      .from('user_despachos')
      .select('id')
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId)
      .single();

    console.log('📊 Resultado búsqueda:', { userDespacho, checkError });

    if (checkError || !userDespacho) {
      console.error('❌ No se encontró relación user_despachos:', checkError);
      return NextResponse.json(
        { error: 'No estás asignado a este despacho' },
        { status: 404 }
      );
    }

    // Eliminar relación en user_despachos
    const { error: deleteRelationError } = await supabase
      .from('user_despachos')
      .delete()
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId);

    if (deleteRelationError) {
      console.error('❌ Error al eliminar relación user_despachos:', deleteRelationError);
      return NextResponse.json(
        { error: 'Error al desasignar del despacho' },
        { status: 500 }
      );
    }

    // Limpiar owner_email si el usuario desasignado era el propietario
    if (despacho.owner_email === user.email) {
      console.log('🧹 Limpiando owner_email del despacho');
      
      const { error: updateOwnerError } = await supabase
        .from('despachos')
        .update({ 
          owner_email: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', despachoId);

      if (updateOwnerError) {
        console.error('⚠️ Error al limpiar owner_email:', updateOwnerError);
        // No es crítico, continuar
      } else {
        console.log('✅ owner_email limpiado correctamente');
      }
    }

    // Cancelar solicitudes aprobadas para permitir nueva solicitud
    console.log('🔄 Actualizando solicitudes aprobadas a canceladas');
    
    const { error: updateSolicitudError } = await supabase
      .from('solicitudes_despacho')
      .update({ 
        estado: 'cancelada',
        fecha_respuesta: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId)
      .eq('estado', 'aprobado');

    if (updateSolicitudError) {
      console.error('⚠️ Error al actualizar solicitudes:', updateSolicitudError);
      // No es crítico, continuar
    } else {
      console.log('✅ Solicitudes actualizadas correctamente');
    }

    console.log('✅ Usuario desasignado exitosamente del despacho');

    return NextResponse.json(
      { 
        message: 'Desasignado del despacho exitosamente',
        despachoId: despachoId,
        despachoNombre: despacho.nombre
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en DELETE user/despacho:', error);
    return NextResponse.json(
      { error: 'Error al desasignar del despacho' },
      { status: 500 }
    );
  }
}
