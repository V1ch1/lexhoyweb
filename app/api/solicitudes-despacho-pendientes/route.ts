import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Obtener solicitudes pendientes
    const { data, error } = await supabase
      .from('solicitudes_despacho')
      .select('*')
      .eq('estado', 'pendiente');

    if (error) {
      return NextResponse.json({ error: 'Error al obtener solicitudes', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ pendientes: data.length, solicitudes: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno', details: String(err) }, { status: 500 });
  }
}
