import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * API Route para solicitar eliminación de datos (GDPR)
 * POST /api/user/request-deletion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener email del usuario
    const { data: userData } = await supabase
      .from('users')
      .select('email, nombre, apellidos')
      .eq('id', userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Crear solicitud de eliminación
    const { error: insertError } = await supabase
      .from('solicitudes_eliminacion_datos')
      .insert({
        user_id: userId,
        email: userData.email,
        nombre_completo: `${userData.nombre} ${userData.apellidos}`,
        fecha_solicitud: new Date().toISOString(),
        estado: 'pendiente',
      });

    if (insertError) {
      console.error('Error al crear solicitud:', insertError);
      return NextResponse.json(
        { error: 'Error al crear solicitud de eliminación' },
        { status: 500 }
      );
    }

    // TODO: Enviar email de confirmación al usuario
    // TODO: Notificar a los administradores

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación creada. Recibirás un correo de confirmación en las próximas 24 horas.',
    });
  } catch (error) {
    console.error('Error al procesar solicitud de eliminación:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
