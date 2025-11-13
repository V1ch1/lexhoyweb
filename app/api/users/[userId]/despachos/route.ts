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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      // 1. Primero, obtener los despachos asociados al usuario
      const { data: userDespachos, error: userDespachosError } = await supabase
        .from('user_despachos')
        .select('id, despacho_id, fecha_asignacion')
        .eq('user_id', userId)
        .eq('activo', true);

      if (userDespachosError) {
        console.error('Error al obtener user_despachos:', userDespachosError);
        throw userDespachosError;
      }

      // Si no hay despachos, devolver array vacío
      if (!userDespachos || userDespachos.length === 0) {
        return NextResponse.json([]);
      }

      // 2. Obtener los IDs de los despachos
      const despachoIds = userDespachos.map(ud => ud.despacho_id);

      // 3. Obtener los detalles de los despachos
      const { data: despachos, error: despachosError } = await supabase
        .from('despachos')
        .select('*')
        .in('id', despachoIds);

      if (despachosError) {
        console.error('Error al obtener los despachos:', despachosError);
        throw despachosError;
      }

      // 4. Contar las sedes activas de cada despacho
      const sedesCount: Record<string, number> = {};
      for (const despachoId of despachoIds) {
        const { count, error: countError } = await supabase
          .from('sedes')
          .select('*', { count: 'exact', head: true })
          .eq('despacho_id', despachoId)
          .eq('activa', true);
        
        if (!countError) {
          sedesCount[despachoId] = count || 0;
        } else {
          sedesCount[despachoId] = 0;
        }
      }

      // 5. Transformar los datos para que coincidan con la interfaz esperada
      const transformedDespachos = userDespachos.map(ud => {
        const despacho = despachos.find(d => d.id === ud.despacho_id);
        return {
          id: ud.despacho_id,
          nombre: despacho?.nombre || 'Sin nombre',
          localidad: despacho?.direccion, // Usar dirección como localidad
          provincia: despacho?.provincia || '',
          telefono: despacho?.telefono,
          email: despacho?.email,
          web: despacho?.web,
          descripcion: despacho?.descripcion,
          num_sedes: sedesCount[ud.despacho_id] || 0,  // Usar el conteo real de sedes activas
          estado: 'verificado', // Asumimos que si está en la tabla, está verificado
          created_at: ud.fecha_asignacion || despacho?.created_at,
        };
      });

      return NextResponse.json(transformedDespachos, { status: 200 });

    } catch (error) {
      console.error('❌ Error al consultar despachos:', error);
      // En caso de error, devolver array vacío
      return NextResponse.json([], { status: 200 });
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error procesando la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
