import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTodo() {
  console.log('🔍 VERIFICACIÓN GLOBAL\n');

  // 1. Listar TODAS las solicitudes recientes
  console.log('📄 Últimas 5 solicitudes en el sistema:');
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select('*, user:users(email)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (solError) console.error('Error solicitudes:', solError.message);
  else {
    if (solicitudes?.length === 0) console.log('   No hay solicitudes en el sistema.');
    solicitudes?.forEach(s => {
      console.log(`   - ID: ${s.id}`);
      console.log(`     User Email (relación): ${(s.user as any)?.email}`);
      console.log(`     User Email (columna): ${s.user_email}`);
      console.log(`     Despacho ID: ${s.despacho_id}`);
      console.log(`     Fecha: ${s.created_at || s.fecha_solicitud}`);
    });
  }

  // 2. Listar TODAS las notificaciones recientes
  console.log('\n🔔 Últimas 5 notificaciones en el sistema:');
  const { data: notificaciones, error: notifError } = await supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) console.error('Error notificaciones:', notifError.message);
  else {
    if (notificaciones?.length === 0) console.log('   No hay notificaciones en el sistema.');
    notificaciones?.forEach(n => {
      console.log(`   - ID: ${n.id}`);
      console.log(`     User ID: ${n.user_id}`);
      console.log(`     Mensaje: ${n.mensaje}`);
      console.log(`     Fecha: ${n.created_at}`);
    });
  }
}

verificarTodo().catch(console.error);
