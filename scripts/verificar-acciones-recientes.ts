import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarAcciones() {
  const email = 'blancocasal@gmail.com';
  console.log(`🔍 Verificando acciones para: ${email}\n`);

  // 1. Verificar Solicitudes
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select('*, despacho:despachos(nombre)')
    .eq('user_email', email)
    .order('fecha_solicitud', { ascending: false });

  if (solError) console.error('Error solicitudes:', solError.message);
  else {
    console.log(`📄 Solicitudes encontradas: ${solicitudes?.length || 0}`);
    solicitudes?.forEach(s => {
      console.log(`   - Despacho: ${(s.despacho as any)?.nombre}`);
      console.log(`     Estado: ${s.estado}`);
      console.log(`     Fecha: ${s.fecha_solicitud}`);
    });
  }

  // 2. Verificar Despachos Creados (donde es owner)
  const { data: despachos, error: despError } = await supabase
    .from('despachos')
    .select('id, nombre, created_at')
    .eq('owner_email', email)
    .order('created_at', { ascending: false });

  if (despError) console.error('Error despachos:', despError.message);
  else {
    console.log(`\n🏢 Despachos donde es owner: ${despachos?.length || 0}`);
    despachos?.forEach(d => {
      console.log(`   - Nombre: ${d.nombre}`);
      console.log(`     Creado: ${d.created_at}`);
    });
  }
}

verificarAcciones().catch(console.error);
