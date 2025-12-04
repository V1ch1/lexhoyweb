import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notificationService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }
    
    // Obtener el lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError || !lead) {
      console.error('Error obteniendo lead:', leadError);
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    console.log('📧 Notificando nuevo lead:', {
      id: lead.id,
      especialidad: lead.especialidad,
      urgencia: lead.urgencia
    });
    
    // Obtener todos los despacho_admin activos
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('rol', 'despacho_admin')
      .eq('activo', true);
    
    if (adminsError) {
      console.error('Error obteniendo admins:', adminsError);
    }
    
    if (admins && admins.length > 0) {
      // Crear notificaciones para todos los despacho_admin
      await NotificationService.createMany(
        admins.map(a => a.id),
        {
          tipo: 'nuevo_lead',
          titulo: `🎯 Nuevo Lead: ${lead.especialidad || 'General'}`,
          mensaje: `Lead de ${lead.urgencia || 'media'} urgencia. Calidad: ${lead.puntuacion_calidad || 50}/100. Precio: ${lead.precio_estimado || 100}€`,
          url: `/dashboard/leads/${lead.id}`,
          metadata: {
            leadId: lead.id,
            especialidad: lead.especialidad,
            urgencia: lead.urgencia,
            precio_estimado: lead.precio_estimado
          }
        }
      );
      
      console.log(`✅ ${admins.length} notificaciones creadas`);
    } else {
      console.warn('⚠️ No hay despacho_admin activos para notificar');
    }
    
    return NextResponse.json({
      success: true,
      notified: admins?.length || 0
    });
  } catch (error) {
    console.error('Error en notify-new:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
