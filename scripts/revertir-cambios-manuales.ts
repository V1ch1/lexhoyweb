import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function revertirCambios() {
  const solicitudId = '5bbdac04-8382-4013-be1a-d3e4ae7022ab';
  const userEmail = 'blancocasal@gmail.com';
  const despachoId = 'a6bfc210-2a17-44de-a07f-91f4a884ebca';

  console.log('⏪ REVIRTIENDO CAMBIOS (Volviendo a estado Pendiente)\n');

  // 1. Obtener ID de usuario
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single();
  if (!user) { console.error('Usuario no encontrado'); return; }
  const userId = user.id;

  // 2. Revertir solicitud a pendiente
  console.log('1. Revertir solicitud a pendiente...');
  const { error: solError } = await supabase
    .from('solicitudes_despacho')
    .update({ 
      estado: 'pendiente',
      fecha_respuesta: null,
      respuesta_notas: null
    })
    .eq('id', solicitudId);
  if (solError) console.error('❌ Error solicitud:', solError);
  else console.log('✅ Solicitud revertida a pendiente');

  // 3. Quitar owner del despacho
  console.log('2. Quitar owner del despacho...');
  const { error: despError } = await supabase
    .from('despachos')
    .update({ owner_email: null })
    .eq('id', despachoId);
  if (despError) console.error('❌ Error despacho:', despError);
  else console.log('✅ Despacho liberado');

  // 4. Eliminar relación user_despachos
  console.log('3. Eliminar user_despachos...');
  const { error: udError } = await supabase
    .from('user_despachos')
    .delete()
    .eq('user_id', userId)
    .eq('despacho_id', despachoId);
  if (udError) console.error('❌ Error user_despachos:', udError);
  else console.log('✅ Relación eliminada');

  // 5. Revertir rol usuario
  console.log('4. Revertir rol usuario a "usuario"...');
  const { error: roleError } = await supabase
    .from('users')
    .update({ rol: 'usuario' })
    .eq('id', userId);
  if (roleError) console.error('❌ Error rol:', roleError);
  else console.log('✅ Rol revertido');

  // 6. Eliminar notificaciones creadas manualmente
  console.log('5. Eliminar notificaciones de prueba...');
  const { error: notifError } = await supabase
    .from('notificaciones')
    .delete()
    .eq('user_id', userId)
    .eq('tipo', 'solicitud_aprobada');
  if (notifError) console.error('❌ Error notificación:', notifError);
  else console.log('✅ Notificaciones eliminadas');

  console.log('\n🔄 ESTADO RESTAURADO: El usuario debe ver la solicitud como pendiente y el despacho sin dueño.');
}

revertirCambios().catch(console.error);
