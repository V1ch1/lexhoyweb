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
    const { email, userId, userName } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      );
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en DB
    const { error: insertError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting verification token:', insertError);
      return NextResponse.json(
        { error: 'Error creating verification token' },
        { status: 500 }
      );
    }

    // Construir URL de verificación
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Enviar email de verificación
    const emailSent = await EmailService.send({
      to: email,
      subject: 'Verifica tu email - LexHoy',
      html: EmailService.templateVerificationEmail({
        userName: userName || email.split('@')[0],
        verificationUrl,
      }),
    });

    if (!emailSent) {
      console.error('Error sending verification email');
      // No fallar la request si el email falla, el usuario puede solicitar reenvío
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });
  } catch (error) {
    console.error('Error in send-verification-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
