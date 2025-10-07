import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log('📊 Obteniendo despachos para usuario:', userId);

    // TEMPORALMENTE: Devolver array vacío para evitar problemas de RLS
    // TODO: Configurar políticas RLS correctamente en user_despachos
    console.log('⚠️ Devolviendo array vacío temporalmente (RLS no configurado)');
    return NextResponse.json([], { status: 200 });

    /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
    // Consultar directamente la tabla user_despachos con join a despachos
    const { data: userDespachos, error } = await supabaseAdmin
      .from('user_despachos')
      .select(`
        id,
        despacho_id,
        fecha_asignacion,
        despachos (
          id,
          nombre,
          localidad,
          provincia,
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

    if (error) {
      console.error('❌ Error al consultar despachos:', error);
      return NextResponse.json(
        { error: "Error fetching despachos", details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Despachos encontrados:', userDespachos?.length || 0);

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedDespachos = (userDespachos || []).map((d: any) => ({
      id: d.despachos?.id || d.despacho_id,
      nombre: d.despachos?.nombre || 'Sin nombre',
      localidad: d.despachos?.localidad,
      provincia: d.despachos?.provincia,
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
