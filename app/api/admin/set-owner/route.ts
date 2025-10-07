import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { despachoId, ownerEmail } = await request.json();

    if (!despachoId || !ownerEmail) {
      return NextResponse.json(
        { error: "despachoId and ownerEmail are required" },
        { status: 400 }
      );
    }

    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Actualizar owner_email del despacho
    const { data, error } = await supabase
      .from('despachos')
      .update({ owner_email: ownerEmail })
      .eq('object_id', despachoId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando propietario:', error);
      return NextResponse.json(
        { error: 'Error al actualizar propietario', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, despacho: data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
