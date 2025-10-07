import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Actualizar estado del usuario
    const { data, error } = await supabase
      .from('users')
      .update({
        estado: 'activo',
        activo: true,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error activando usuario:', error);
      return NextResponse.json(
        { error: 'Error al activar usuario', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
