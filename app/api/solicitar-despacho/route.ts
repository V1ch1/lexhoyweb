import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  let debugBody = null;
  try {
    // Debug: log incoming request
    console.log('POST /api/solicitar-despacho called');
    // Leer el JWT del header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Crear cliente Supabase con el token del usuario
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const body = await request.json();
    debugBody = body;
    const { userId, despachoId, userEmail, userName, despachoNombre, despachoLocalidad, despachoProvincia } = body;
    if (!userId || !despachoId || !userEmail || !userName || !despachoNombre) {
      console.error('Faltan datos en la solicitud:', body);
      return NextResponse.json({ error: 'Faltan datos', body }, { status: 400 });
    }
    // Comprobar si ya existe una solicitud pendiente o aprobada para este usuario y despacho
    const { data: solicitudesExistentes, error: errorExistente } = await supabase
      .from('solicitudes_despacho')
      .select('id, estado')
      .eq('user_id', userId)
      .eq('despacho_id', String(despachoId))
      .in('estado', ['pendiente', 'aprobada']);
    if (errorExistente) {
      console.error('Error al comprobar solicitudes existentes:', errorExistente, { userId, despachoId });
      return NextResponse.json({ error: 'Error al comprobar solicitudes existentes', details: String(errorExistente), userId, despachoId }, { status: 500 });
    }
    if (solicitudesExistentes && solicitudesExistentes.length > 0) {
      console.warn('Solicitud duplicada detectada:', solicitudesExistentes);
      return NextResponse.json({ error: 'Ya existe una solicitud pendiente o aprobada para este despacho.', solicitudesExistentes }, { status: 400 });
    }
    // Insertar la solicitud usando el cliente con JWT
    const { error } = await supabase
      .from('solicitudes_despacho')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        despacho_id: String(despachoId),
        despacho_nombre: despachoNombre,
        despacho_localidad: despachoLocalidad,
        despacho_provincia: despachoProvincia,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString()
      });
    if (error) {
      console.error('Error al crear solicitud:', error, { userId, despachoId, userEmail, userName, despachoNombre, despachoLocalidad, despachoProvincia });
      return NextResponse.json({ error: 'Error al crear solicitud', details: JSON.stringify(error), userId, despachoId, userEmail, userName, despachoNombre, despachoLocalidad, despachoProvincia }, { status: 500 });
    }
    console.log('Solicitud creada correctamente para', userId, despachoId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error interno en /api/solicitar-despacho:', err);
    return NextResponse.json({ error: 'Error interno', details: String(err), debugBody: typeof debugBody === 'object' ? debugBody : null }, { status: 500 });
  }
}

// GET no implementado en producción
