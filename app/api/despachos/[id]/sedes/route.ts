import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SedeService, type SedeInput } from '@/lib/sedeService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/despachos/[id]/sedes
 * Listar todas las sedes de un despacho
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;

    console.log('📋 Listando sedes del despacho:', despachoId);

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
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos: propietario del despacho o super_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = userData?.role === 'super_admin';

    // Verificar si es propietario del despacho
    const { data: userDespacho } = await supabase
      .from('user_despachos')
      .select('id')
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId)
      .single();

    if (!isSuperAdmin && !userDespacho) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver las sedes de este despacho' },
        { status: 403 }
      );
    }

    // Listar sedes
    const result = await SedeService.listarSedesDespacho(despachoId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sedes: result.data,
      total: result.data?.length || 0
    });

  } catch (error) {
    console.error('❌ Error en GET /api/despachos/[id]/sedes:', error);
    return NextResponse.json(
      {
        error: 'Error al listar sedes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/despachos/[id]/sedes
 * Crear una nueva sede para un despacho
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despachoId } = await context.params;

    console.log('📝 Creando nueva sede para despacho:', despachoId);
    console.log('📦 Headers:', request.headers.get('content-type'));

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
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos: propietario del despacho o super_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = userData?.role === 'super_admin';

    // Verificar si es propietario del despacho
    const { data: userDespacho } = await supabase
      .from('user_despachos')
      .select('id')
      .eq('user_id', user.id)
      .eq('despacho_id', despachoId)
      .single();

    if (!isSuperAdmin && !userDespacho) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear sedes en este despacho' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));
    
    const {
      nombre,
      descripcion,
      // Ubicación
      calle,
      numero,
      piso,
      localidad,
      provincia,
      codigo_postal,
      pais,
      // Contacto
      telefono,
      email_contacto,
      persona_contacto,
      web,
      // Adicional
      ano_fundacion,
      tamano_despacho,
      // Estado
      es_principal,
      foto_perfil,
    } = body;

    // Validar campos requeridos
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la sede es requerido' },
        { status: 400 }
      );
    }
    if (!localidad) {
      return NextResponse.json(
        { error: 'La localidad es requerida' },
        { status: 400 }
      );
    }
    if (!provincia) {
      return NextResponse.json(
        { error: 'La provincia es requerida' },
        { status: 400 }
      );
    }
    if (!email_contacto) {
      return NextResponse.json(
        { error: 'El email de contacto es requerido' },
        { status: 400 }
      );
    }
    if (!telefono) {
      return NextResponse.json(
        { error: 'El teléfono es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos de la sede
    const sedeData: SedeInput = {
      despacho_id: despachoId,
      nombre,
      descripcion: descripcion || '',
      // Ubicación
      calle: calle || '',
      numero: numero || '',
      piso: piso || '',
      localidad,
      provincia,
      codigo_postal: codigo_postal || '',
      pais: pais || 'España',
      // Contacto
      telefono,
      email_contacto,
      persona_contacto: persona_contacto || '',
      web: web || '',
      // Adicional
      ano_fundacion: ano_fundacion || '',
      tamano_despacho: tamano_despacho || '',
      // Estado
      es_principal: es_principal || false,
      foto_perfil: foto_perfil || '',
    };

    // Crear sede en Supabase
    const result = await SedeService.crearSede(sedeData);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Error al crear sede' },
        { status: 500 }
      );
    }

    console.log('✅ Sede creada en Supabase:', result.data.id);

    // Intentar sincronizar con WordPress
    console.log('🔄 Sincronizando sede con WordPress...');
    
    try {
      // Obtener información del despacho
      const { data: despacho } = await supabase
        .from('despachos')
        .select('object_id')
        .eq('id', despachoId)
        .single();

      if (despacho?.object_id) {
        // Aquí deberías implementar la sincronización con WordPress
        // Por ahora solo lo registramos
        console.log('⚠️ Sincronización con WordPress pendiente de implementar');
        // TODO: Implementar SyncService.sincronizarSedeAWordPress(result.data.id)
      }
    } catch (syncError) {
      console.warn('⚠️ Error al sincronizar con WordPress:', syncError);
      // No fallar la creación si la sincronización falla
    }

    return NextResponse.json({
      success: true,
      message: 'Sede creada correctamente',
      sede: result.data
    });

  } catch (error) {
    console.error('❌ Error en POST /api/despachos/[id]/sedes:', error);
    return NextResponse.json(
      {
        error: 'Error al crear sede',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
