import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obtener total de usuarios
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Obtener usuarios por rol
    const { data: users } = await supabase
      .from('users')
      .select('rol');

    const usersByRole = {
      super_admin: users?.filter(u => u.rol === 'super_admin').length || 0,
      despacho_admin: users?.filter(u => u.rol === 'despacho_admin').length || 0,
      usuario: users?.filter(u => u.rol === 'usuario').length || 0,
    };

    // Obtener despachos verificados
    const { count: verifiedDespachos } = await supabase
      .from('despachos')
      .select('*', { count: 'exact', head: true })
      .eq('estado_verificacion', 'verificado');

    // Obtener total de leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      verifiedDespachos: verifiedDespachos || 0,
      totalLeads: totalLeads || 0,
      usersByRole,
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
