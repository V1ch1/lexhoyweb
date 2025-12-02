import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function verificarEstadoActual() {
  const userEmail = 'blancocasal@gmail.com';
  const despachoId = 'a6bfc210-2a17-44de-a07f-91f4a884ebca'; // ID de Vento según logs anteriores

  console.log('🔍 VERIFICACIÓN DE ESTADO ACTUAL\n');

  // 1. Verificar Usuario y Rol
  const { data: user } = await supabase.from('users').select('id, email, rol').eq('email', userEmail).single();
  console.log(`👤 Usuario: ${user?.email}`);
  console.log(`   Rol: ${user?.rol} (Esperado: despacho_admin)`);

  // 2. Verificar Despacho
  const { data: despacho } = await supabase.from('despachos').select('id, nombre, owner_email').eq('id', despachoId).single();
  console.log(`\n🏢 Despacho: ${despacho?.nombre}`);
  console.log(`   Owner Email: ${despacho?.owner_email} (Esperado: ${userEmail})`);

  // 3. Verificar Relación user_despachos
  const { data: relacion } = await supabase.from('user_despachos').select('*').eq('user_id', user?.id).eq('despacho_id', despachoId);
  console.log(`\n🔗 Relación user_despachos: ${relacion?.length > 0 ? '✅ Existe' : '❌ No existe'}`);

  // 4. Verificar Solicitud
  const { data: solicitud } = await supabase.from('solicitudes_despacho').select('*').eq('despacho_id', despachoId).order('created_at', { ascending: false }).limit(1).single();
  console.log(`\n📄 Solicitud Estado: ${solicitud?.estado} (Esperado: aprobado)`);

  // 5. Verificar Notificaciones
  const { data: notificaciones } = await supabase.from('notificaciones').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(3);
  console.log(`\n🔔 Últimas notificaciones para el usuario:`);
  notificaciones?.forEach(n => console.log(`   - [${n.tipo}] ${n.titulo}: ${n.mensaje}`));
}

verificarEstadoActual().catch(console.error);
