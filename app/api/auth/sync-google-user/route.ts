import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();

    if (!user?.email) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!existingUser) {
      // Crear nuevo usuario
      const adminEmails = [
        'jose@blancoyenbatea.com',
        'luis.ogando@blancoyenbatea.com',
        'manu@blancoyenbatea.com',
        'blancocasal@gmail.com',
      ];
      
      const rol = adminEmails.includes(user.email) ? 'super_admin' : 'usuario';
      const plan = adminEmails.includes(user.email) ? 'premium' : 'basico';

      const { error: insertError } = await supabase.from('users').insert({
        email: user.email,
        nombre: user.name?.split(' ')[0] || '',
        apellidos: user.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: user.image,
        rol,
        plan,
        activo: true,
        email_verificado: true,
        estado: 'aprobado',
        fecha_registro: new Date().toISOString(),
        ultimo_acceso: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
      }
    } else {
      // Actualizar último acceso
      await supabase
        .from('users')
        .update({ 
          ultimo_acceso: new Date().toISOString(),
          avatar_url: user.image 
        })
        .eq('id', existingUser.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing Google user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
