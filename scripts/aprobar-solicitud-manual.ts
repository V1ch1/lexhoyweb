import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function aprobarSolicitud() {
  const solicitudId = '5bbdac04-8382-4013-be1a-d3e4ae7022ab';
  const userEmail = 'blancocasal@gmail.com';
  const despachoId = 'a6bfc210-2a17-44de-a07f-91f4a884ebca';

  console.log('🚀 APROBANDO SOLICITUD MANUALMENTE\n');

  // 1. Obtener ID de usuario
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single();
  if (!user) { console.error('Usuario no encontrado'); return; }
  const userId = user.id;

  // 2. Actualizar solicitud
  console.log('1. Actualizando solicitud...');
  const { error: solError } = await supabase
    .from('solicitudes_despacho')
    .update({ 
      estado: 'aprobado',
      fecha_respuesta: new Date().toISOString(),
      respuesta_notas: 'Aprobado manualmente por script de verificación'
    })
    .eq('id', solicitudId);
  if (solError) console.error('❌ Error solicitud:', solError);
  else console.log('✅ Solicitud actualizada');

  // 3. Actualizar despacho
  console.log('2. Actualizando despacho...');
  const { error: despError } = await supabase
    .from('despachos')
    .update({ owner_email: userEmail })
    .eq('id', despachoId);
  if (despError) console.error('❌ Error despacho:', despError);
  else console.log('✅ Despacho actualizado');

  // 4. Crear user_despachos
  console.log('3. Creando user_despachos...');
  const { error: udError } = await supabase
    .from('user_despachos')
    .insert({ user_id: userId, despacho_id: despachoId });
  if (udError) console.error('❌ Error user_despachos:', udError);
  else console.log('✅ user_despachos creado');

  // 5. Actualizar rol usuario
  console.log('4. Actualizando rol usuario...');
  const { error: roleError } = await supabase
    .from('users')
    .update({ rol: 'despacho_admin' })
    .eq('id', userId);
  if (roleError) console.error('❌ Error rol:', roleError);
  else console.log('✅ Rol actualizado');

  // 6. Crear notificación
  console.log('5. Creando notificación...');
  const { error: notifError } = await supabase
    .from('notificaciones')
    .insert({
      user_id: userId,
      tipo: 'solicitud_aprobada',
      mensaje: 'Tu solicitud de propiedad para el despacho ha sido aprobada.',
      leida: false
    });
  if (notifError) console.error('❌ Error notificación:', notifError);
  else console.log('✅ Notificación creada');

  console.log('\n🎉 PROCESO COMPLETADO');
}

aprobarSolicitud().catch(console.error);
