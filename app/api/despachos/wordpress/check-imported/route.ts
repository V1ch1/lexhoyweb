import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or service role key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objectId = searchParams.get('objectId');

    if (!objectId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro objectId' },
        { status: 400 }
      );
    }

    // Buscar en la tabla de despachos por object_id (ID de WordPress)
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select('id')
      .eq('object_id', objectId)
      .single();

    if (despachoError && despachoError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error al buscar el despacho:', despachoError);
      return NextResponse.json(
        { error: 'Error al verificar el despacho' },
        { status: 500 }
      );
    }

    // Si encontramos el despacho, verificar si tiene sedes
    if (despacho) {
      const { data: sedes, error: sedesError } = await supabase
        .from('sedes')
        .select('id')
        .eq('despacho_id', despacho.id);

      if (sedesError) {
        console.error('Error al buscar las sedes del despacho:', sedesError);
        return NextResponse.json(
          { error: 'Error al verificar las sedes del despacho' },
          { status: 500 }
        );
      }

      // Si tiene al menos una sede, consideramos que ya está importado
      if (sedes && sedes.length > 0) {
        return NextResponse.json({ isImported: true });
      }
    }

    // Si llegamos aquí, el despacho no está importado o no tiene sedes
    return NextResponse.json({ isImported: false });

  } catch (error) {
    console.error('Error en la verificación de importación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
