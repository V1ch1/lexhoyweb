import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSimple() {
  console.log('🔍 VERIFICACIÓN SIMPLE\n');

  // 1. Listar solicitudes sin join
  console.log('📄 Solicitudes (raw):');
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (solError) {
      console.error('Error solicitudes:', solError);
  } else {
    console.log(`   Total encontradas: ${solicitudes?.length || 0}`);
    solicitudes?.forEach(s => {
      console.log(`   - ID: ${s.id}`);
      console.log(`     User Email: ${s.user_email}`);
      console.log(`     Despacho ID: ${s.despacho_id}`);
      console.log(`     Estado: ${s.estado}`);
    });
  }
}

verificarSimple().catch(console.error);
