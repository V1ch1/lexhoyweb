
import { NextResponse } from 'next/server';
import { obtenerSolicitudesPorUsuario } from '@/lib/solicitudesService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }
  try {
    const userSolicitudes = await obtenerSolicitudesPorUsuario(userId);
    return NextResponse.json(userSolicitudes, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar solicitudes', details: String(err) }, { status: 500 });
  }
}
