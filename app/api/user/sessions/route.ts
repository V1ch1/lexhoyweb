import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * API Route para obtener todas las sesiones activas del usuario
 * GET /api/user/sessions
 * Nota: Con NextAuth + JWT, solo tenemos acceso a la sesión actual.
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Simulamos una lista de sesiones con la sesión actual
    const formattedSessions = [{
      id: 'current',
      status: 'active',
      lastActiveAt: new Date().toISOString(),
      expireAt: session.expires,
      abandonAt: null,
      clientId: 'current',
      isCurrent: true
    }];

    return NextResponse.json({
      sessions: formattedSessions,
      total: 1,
    });
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    );
  }
}
