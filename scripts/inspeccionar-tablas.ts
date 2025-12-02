import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspeccionarTablas() {
  console.log('🔍 INSPECCIONANDO TABLAS\n');
  
  // LEADS
  console.log('--- Tabla: leads ---');
  const { data: leads, error: errLeads } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
    
  if (errLeads) {
    console.error('Error leads:', errLeads);
  } else if (leads && leads.length > 0) {
    console.log('Columnas:', Object.keys(leads[0]));
  } else {
    console.log('Tabla vacía o sin permisos');
  }

  // LEADS_COMPRADOS
  console.log('\n--- Tabla: leads_comprados ---');
  const { data: leadsComp, error: errLC } = await supabase
    .from('leads_comprados')
    .select('*')
    .limit(1);
    
  if (errLC) {
    console.error('Error leads_comprados:', errLC);
  } else if (leadsComp && leadsComp.length > 0) {
    console.log('Columnas:', Object.keys(leadsComp[0]));
  } else {
    console.log('Tabla vacía o sin permisos');
  }
}

inspeccionarTablas().catch(console.error);
