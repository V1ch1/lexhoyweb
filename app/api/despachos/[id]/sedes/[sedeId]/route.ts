import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Obtener una sede específica
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; sedeId: string }> }
) {
  try {
    const { id: despachoId, sedeId } = await context.params;

    console.log('📖 Obteniendo sede:', sedeId, 'del despacho:', despachoId);

    // Obtener la sede
    const { data: sede, error } = await supabase
      .from('sedes')
      .select('*')
      .eq('id', sedeId)
      .eq('despacho_id', despachoId)
      .single();

    if (error) {
      console.error('❌ Error al obtener sede:', error);
      return NextResponse.json(
        { error: 'Sede no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Sede obtenida:', sede.nombre);

    return NextResponse.json({ sede }, { status: 200 });
  } catch (error) {
    console.error('❌ Error en GET sede:', error);
    return NextResponse.json(
      { error: 'Error al obtener la sede' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar una sede específica
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; sedeId: string }> }
) {
  try {
    const { id: despachoId, sedeId } = await context.params;
    const body = await request.json();

    console.log('✏️ Actualizando sede:', sedeId);

    // Validar que la sede pertenece al despacho
    const { data: sedeExistente, error: checkError } = await supabase
      .from('sedes')
      .select('id')
      .eq('id', sedeId)
      .eq('despacho_id', despachoId)
      .single();

    if (checkError || !sedeExistente) {
      return NextResponse.json(
        { error: 'Sede no encontrada o no pertenece a este despacho' },
        { status: 404 }
      );
    }

    // Actualizar la sede
    const { data: sedeActualizada, error: updateError } = await supabase
      .from('sedes')
      .update(body)
      .eq('id', sedeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar sede:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la sede' },
        { status: 500 }
      );
    }

    console.log('✅ Sede actualizada:', sedeActualizada.nombre);

    return NextResponse.json({ sede: sedeActualizada }, { status: 200 });
  } catch (error) {
    console.error('❌ Error en PUT sede:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la sede' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar una sede específica
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; sedeId: string }> }
) {
  try {
    const { id: despachoId, sedeId } = await context.params;

    console.log('🗑️ Eliminando sede:', sedeId, 'del despacho:', despachoId);

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

    console.log('👤 Usuario autenticado:', user.email);

    // Verificar que la sede existe y pertenece al despacho
    const { data: sede, error: sedeError } = await supabase
      .from('sedes')
      .select('*')
      .eq('id', sedeId)
      .eq('despacho_id', despachoId)
      .single();

    if (sedeError || !sede) {
      console.error('❌ Sede no encontrada:', sedeError);
      return NextResponse.json(
        { error: 'Sede no encontrada' },
        { status: 404 }
      );
    }

    console.log('📍 Sede encontrada:', sede.nombre);

    // Verificar permisos: usuario debe estar en user_despachos o ser super_admin
    const isSuperAdmin = user.user_metadata?.role === 'super_admin';
    
    // Verificar si el usuario tiene relación con este despacho
    const { data: userDespacho, error: userDespachoError } = await supabase
      .from('user_despachos')
      .select('*')
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId)
      .maybeSingle();

    const hasAccess = isSuperAdmin || !!userDespacho;

    console.log('🔐 Verificación de permisos:', {
      isSuperAdmin,
      hasUserDespacho: !!userDespacho,
      hasAccess
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta sede' },
        { status: 403 }
      );
    }

    // Contar cuántas sedes tiene el despacho
    const { count, error: countError } = await supabase
      .from('sedes')
      .select('id', { count: 'exact', head: true })
      .eq('despacho_id', despachoId)
      .eq('activa', true);

    if (countError) {
      console.error('❌ Error al contar sedes:', countError);
      return NextResponse.json(
        { error: 'Error al verificar sedes' },
        { status: 500 }
      );
    }

    // Validar que no sea la única sede
    if (count === 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar la única sede del despacho. Debe haber al menos una sede activa.' },
        { status: 400 }
      );
    }

    // Eliminar la sede (soft delete)
    const { error: deleteError } = await supabase
      .from('sedes')
      .update({ 
        activa: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sedeId);

    if (deleteError) {
      console.error('❌ Error al eliminar sede:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la sede' },
        { status: 500 }
      );
    }

    // Actualizar contador de sedes en el despacho
    const { error: updateCountError } = await supabase
      .from('despachos')
      .update({ 
        num_sedes: (count || 1) - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', despachoId);

    if (updateCountError) {
      console.error('⚠️ Error al actualizar contador de sedes:', updateCountError);
      // No es crítico, continuar
    }

    console.log('✅ Sede eliminada exitosamente');

    return NextResponse.json(
      { 
        message: 'Sede eliminada exitosamente',
        sedeId: sedeId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en DELETE sede:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la sede' },
      { status: 500 }
    );
  }
}
