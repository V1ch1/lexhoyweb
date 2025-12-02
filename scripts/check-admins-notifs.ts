import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkAdmins() {
  console.log('🔍 VERIFICANDO SUPER ADMINS\n');

  // 1. Listar super admins
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, email, rol')
    .eq('rol', 'super_admin');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total Super Admins: ${admins?.length}`);
  
  for (const admin of admins || []) {
    console.log(`\n👤 Admin: ${admin.email} (${admin.id})`);
    
    // 2. Ver sus notificaciones recientes
    const { data: notifs } = await supabase
      .from('notificaciones')
      .select('id, tipo, titulo, created_at')
      .eq('user_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log(`   🔔 Notificaciones recientes: ${notifs?.length}`);
    notifs?.forEach(n => {
      console.log(`      - [${n.created_at}] ${n.tipo}: ${n.titulo}`);
    });
  }
}

checkAdmins().catch(console.error);
