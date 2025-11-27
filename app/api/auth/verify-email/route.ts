import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('Verifying token:', token);

    // Buscar token en la base de datos
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError) {
      console.error('Database error finding token:', tokenError);
    }
    
    if (!tokenData) {
      console.error('Token not found in database');
    } else {
      console.log('Token found:', tokenData);
    }

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      // Eliminar token expirado
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('token', token);

      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Marcar email como verificado en la tabla users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verificado: true,
        estado: 'activo',
        // updated_at: new Date().toISOString() // Columna no existe en el esquema actual
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Error verifying email' },
        { status: 500 }
      );
    }

    // Eliminar token usado
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('token', token);

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Error in verify-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
