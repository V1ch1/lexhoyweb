import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
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
    const { userId, despachoId, userEmail, userName, despachoNombre, despachoLocalidad, despachoProvincia } = body;
    if (!userId || !despachoId || !userEmail || !userName || !despachoNombre) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
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
      return NextResponse.json({ error: 'Error al crear solicitud', details: String(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno', details: String(err) }, { status: 500 });
  }
}

// GET no implementado en producción
