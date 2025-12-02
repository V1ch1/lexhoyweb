import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDetalle() {
  console.log('🔍 VERIFICACIÓN DETALLE\n');

  const { data: solicitudes, error } = await supabase
    .from('solicitudes_despacho')
    .select('id, user_email, despacho_id, estado, created_at')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Solicitudes encontradas: ${solicitudes?.length}`);
    solicitudes?.forEach(s => {
      console.log(`   - ID: ${s.id}`);
      console.log(`     Email: ${s.user_email}`);
      console.log(`     Despacho: ${s.despacho_id}`);
      console.log(`     Estado: ${s.estado}`);
      console.log(`     Fecha: ${s.created_at}`);
    });
  }
}

verificarDetalle().catch(console.error);
