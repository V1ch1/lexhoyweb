import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSolicitud() {
  const email = 'blancocasal@gmail.com';
  console.log(`🔍 Verificando solicitud para: ${email}\n`);

  // 1. Obtener usuario
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
  }

  // 2. Verificar Solicitudes
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select('*, despacho:despachos(nombre)')
    .eq('user_id', user.id)
    .order('fecha_solicitud', { ascending: false });

  if (solError) console.error('Error solicitudes:', solError.message);
  else {
    console.log(`📄 Solicitudes encontradas: ${solicitudes?.length || 0}`);
    solicitudes?.forEach(s => {
      console.log(`   - ID: ${s.id}`);
      console.log(`   - Despacho: ${(s.despacho as any)?.nombre}`);
      console.log(`     Estado: ${s.estado}`);
      console.log(`     Fecha: ${s.fecha_solicitud}`);
    });
  }

  // 3. Verificar Notificaciones
  console.log('\n🔔 Notificaciones del usuario:');
  const { data: notificaciones, error: notifError } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (notifError) console.error('Error notificaciones:', notifError.message);
  else {
    console.log(`   Total: ${notificaciones?.length || 0}`);
    notificaciones?.forEach(n => {
      console.log(`   - Tipo: ${n.tipo}`);
      console.log(`     Mensaje: ${n.mensaje}`);
      console.log(`     Leída: ${n.leida}`);
      console.log(`     Fecha: ${n.created_at}`);
    });
  }
}

verificarSolicitud().catch(console.error);
