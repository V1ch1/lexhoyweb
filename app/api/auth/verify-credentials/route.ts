import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Buscar usuario en Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verificar contraseña
    if (!user.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Actualizar último acceso
    await supabase
      .from('users')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', user.id);

    // Retornar datos del usuario para NextAuth
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: `${user.nombre} ${user.apellidos}`,
      image: user.avatar_url,
      rol: user.rol,
      plan: user.plan,
      activo: user.activo,
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
