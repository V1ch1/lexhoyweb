import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { EmailService } from '@/lib/emailService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nombre, apellidos, email')
      .eq('email', email)
      .single();

    // Por seguridad, siempre retornar success incluso si el usuario no existe
    // Esto previene que atacantes descubran qué emails están registrados
    if (userError || !user) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link' 
      });
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en DB
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email: user.email,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Error inserting password reset token:', insertError);
      return NextResponse.json(
        { error: 'Error creating reset token' },
        { status: 500 }
      );
    }

    // Construir URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Enviar email de recuperación
    const userName = user.nombre 
      ? `${user.nombre} ${user.apellidos || ''}`.trim()
      : user.email.split('@')[0];

    const emailSent = await EmailService.send({
      to: user.email,
      subject: 'Recupera tu contraseña - LexHoy',
      html: EmailService.templatePasswordReset({
        userName,
        resetUrl,
      }),
    });

    if (!emailSent) {
      console.error('Error sending password reset email');
      // Continuar de todos modos para no revelar si el usuario existe
    }

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link' 
    });
  } catch (error) {
    console.error('Error in request-password-reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
