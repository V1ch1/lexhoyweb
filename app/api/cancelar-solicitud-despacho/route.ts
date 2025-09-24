
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    // Leer el JWT del header Authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Crear cliente Supabase con el token del usuario
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { solicitudId, userId } = await req.json();
    if (!solicitudId || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }
    // Verifica que la solicitud pertenezca al usuario
    const { data: solicitud, error: errorSolicitud } = await supabase
      .from('solicitudes_despacho')
      .select('id, user_id, estado')
      .eq('id', solicitudId)
      .single();
    if (errorSolicitud || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    if (solicitud.user_id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Solo se pueden cancelar solicitudes pendientes' }, { status: 400 });
    }
    // Actualiza el estado a cancelada
    const { error: errorUpdate } = await supabase
      .from('solicitudes_despacho')
      .update({ estado: 'cancelada' })
      .eq('id', solicitudId);
    if (errorUpdate) {
      return NextResponse.json({ error: 'No se pudo cancelar la solicitud' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}
