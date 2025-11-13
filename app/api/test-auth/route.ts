import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error de autenticación:', error);
      return NextResponse.json(
        { error: 'No autenticado', details: error.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'No hay sesión activa' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      expiresAt: session.expires_at
    });
  } catch (error) {
    console.error('Error en test-auth:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
