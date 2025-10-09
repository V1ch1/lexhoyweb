/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log('📊 Obteniendo despachos para usuario:', userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Crear una promesa con timeout para evitar que se cuelgue
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 5000);
    });

    // Consultar la tabla user_despachos para obtener los despachos del usuario
    const queryPromise = supabase
      .from('user_despachos')
      .select(`
        id,
        despacho_id,
        fecha_asignacion,
        despachos (
          id,
          nombre,
          direccion,
          telefono,
          email,
          web,
          descripcion,
          num_sedes,
          activo,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('activo', true);

    let userDespachos;
    let error;

    try {
      const result = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      userDespachos = result.data;
      error = result.error;
    } catch (timeoutError) {
      console.error('⏱️ Timeout al consultar despachos:', timeoutError);
      // Si hay timeout, devolver array vacío en lugar de error
      return NextResponse.json([], { status: 200 });
    }

    if (error) {
      console.error('❌ Error al consultar despachos:', error);
      // Si hay error de RLS o tabla no existe, devolver array vacío
      console.log('⚠️ Devolviendo array vacío debido a error de consulta');
      return NextResponse.json([], { status: 200 });
    }

    console.log('✅ Despachos encontrados:', userDespachos?.length || 0);

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedDespachos = (userDespachos || []).map((d: any) => ({
      id: d.despachos?.id || d.despacho_id,
      nombre: d.despachos?.nombre || 'Sin nombre',
      localidad: d.despachos?.direccion, // Usar direccion como localidad
      provincia: '', // No hay provincia separada
      telefono: d.despachos?.telefono,
      email: d.despachos?.email,
      web: d.despachos?.web,
      descripcion: d.despachos?.descripcion,
      num_sedes: d.despachos?.num_sedes || 0,
      estado: d.despachos?.activo ? 'verificado' : 'pendiente',
      created_at: d.fecha_asignacion || d.despachos?.created_at,
    }));

    return NextResponse.json(transformedDespachos, { status: 200 });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error fetching despachos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
