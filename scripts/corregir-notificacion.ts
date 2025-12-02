import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function crearNotificacion() {
  const userEmail = 'blancocasal@gmail.com';
  
  // Obtener ID
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single();
  if (!user) return;

  console.log('🔔 Creando notificación corregida...');
  const { error: notifError } = await supabase
    .from('notificaciones')
    .insert({
      user_id: user.id,
      tipo: 'solicitud_aprobada',
      titulo: 'Solicitud Aprobada', // Campo faltante agregado
      mensaje: 'Tu solicitud de propiedad para el despacho ha sido aprobada.',
      leida: false
    });

  if (notifError) console.error('❌ Error notificación:', notifError);
  else console.log('✅ Notificación creada correctamente');
}

crearNotificacion().catch(console.error);
