import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspeccionarLeads() {
  console.log('🔍 INSPECCIONANDO TABLA LEADS\n');
  
  const { data: leads, error: errLeads } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
    
  if (errLeads) {
    console.error('Error leads:', errLeads);
  } else if (leads && leads.length > 0) {
    console.log('✅ Columnas encontradas en leads:');
    console.log(JSON.stringify(Object.keys(leads[0]), null, 2));
  } else {
    console.log('⚠️ Tabla leads vacía o sin permisos, no se pueden ver columnas.');
  }
}

inspeccionarLeads().catch(console.error);
