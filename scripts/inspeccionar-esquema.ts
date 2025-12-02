import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspeccionarEsquema() {
  console.log('🔍 INSPECCIÓN DE ESQUEMA\n');

  // Consultar information_schema.tables
  // Nota: Supabase-js no permite consultar information_schema directamente con .from() por defecto si no está expuesto.
  // Pero podemos intentar usar RPC si existe, o simplemente probar una query raw si tuviéramos acceso (que no tenemos fácil aquí).
  
  // Alternativa: Intentar insertar un registro dummy y ver el error exacto, o seleccionar count.
  
  console.log('Intentando contar registros en solicitudes_despacho...');
  const { count, error } = await supabase
    .from('solicitudes_despacho')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error al contar:', error);
  } else {
    console.log(`✅ Tabla accesible. Total registros: ${count}`);
  }
}

inspeccionarEsquema().catch(console.error);
