import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('URL:', supabaseUrl ? 'Defined' : 'Undefined');
console.log('Key:', supabaseKey ? 'Defined' : 'Undefined');

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function debugConnection() {
  console.log('🔍 DEBUG CONEXIÓN\n');

  // 1. Probar users
  console.log('Testing users table...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError) console.error('❌ Error users:', userError);
  else console.log(`✅ Users OK. Found: ${users?.length}`);

  // 2. Probar solicitudes_despacho
  console.log('\nTesting solicitudes_despacho table...');
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select('id, user_email, despacho_id, estado, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (solError) console.error('❌ Error solicitudes:', solError);
  else {
    console.log(`✅ Solicitudes OK. Found: ${solicitudes?.length}`);
    solicitudes?.forEach(s => {
      console.log(`   - ID: ${s.id}`);
      console.log(`     Email: ${s.user_email}`);
      console.log(`     Despacho ID: ${s.despacho_id}`);
      console.log(`     Estado: ${s.estado}`);
      console.log(`     Fecha: ${s.created_at}`);
    });
  }

  /*
  // 3. Probar notificaciones
  console.log('\nTesting notificaciones table...');
  const { data: notificaciones, error: notifError } = await supabase
    .from('notificaciones')
    .select('id, user_id, tipo, mensaje, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) console.error('❌ Error notificaciones:', notifError);
  else {
    console.log(`✅ Notificaciones OK. Found: ${notificaciones?.length}`);
    notificaciones?.forEach(n => {
      console.log(`   - Tipo: ${n.tipo}`);
      console.log(`     Mensaje: ${n.mensaje}`);
      console.log(`     Fecha: ${n.created_at}`);
    });
  }
  */
}

debugConnection().catch(console.error);
