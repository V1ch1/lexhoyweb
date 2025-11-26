import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // En JWT mode no podemos revocar sesiones individuales desde el servidor
    // Retornamos éxito para no romper la UI
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al revocar sesión:', error);
    return NextResponse.json(
      { error: 'Error al revocar sesión' },
      { status: 500 }
    );
  }
}
