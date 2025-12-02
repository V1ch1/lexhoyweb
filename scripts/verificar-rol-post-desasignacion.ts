import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function verificarEstadoRol() {
  const userEmail = 'blancocasal@gmail.com';
  console.log('🔍 VERIFICACIÓN DE ROL Y DESPACHOS\n');

  // 1. Verificar Usuario y Rol
  const { data: user } = await supabase.from('users').select('id, email, rol').eq('email', userEmail).single();
  console.log(`👤 Usuario: ${user?.email}`);
  console.log(`   Rol actual en BD: ${user?.rol}`);

  // 2. Verificar Relación user_despachos
  const { data: despachos } = await supabase.from('user_despachos').select('*').eq('user_id', user?.id);
  console.log(`   Despachos asignados: ${despachos?.length}`);

  // 3. Verificar si es owner de algún despacho
  const { data: owned } = await supabase.from('despachos').select('id, nombre').eq('owner_email', userEmail);
  console.log(`   Despachos propios (owner_email): ${owned?.length}`);
  
  if (user?.rol === 'despacho_admin' && despachos?.length === 0 && owned?.length === 0) {
      console.log('\n❌ ERROR CONFIRMADO: El usuario es despacho_admin pero no tiene despachos.');
  } else {
      console.log('\n✅ Estado consistente (o no se reproduce el error exactamente como se describió).');
  }
}

verificarEstadoRol().catch(console.error);
