
import { NextResponse } from 'next/server';
import { crearSolicitudDespacho } from '@/lib/solicitudesService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, despachoId, userEmail, userName, despachoNombre, despachoLocalidad, despachoProvincia } = body;
    if (!userId || !despachoId || !userEmail || !userName || !despachoNombre) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    await crearSolicitudDespacho(
      userId,
      despachoId,
      userEmail,
      userName,
      despachoNombre,
      despachoLocalidad,
      despachoProvincia
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno', details: String(err) }, { status: 500 });
  }
}

// GET no implementado en producción
