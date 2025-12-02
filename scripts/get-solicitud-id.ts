import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function getId() {
  const { data: solicitudes, error } = await supabase
    .from('solicitudes_despacho')
    .select('id, user_email, despacho_id')
    .limit(1);

  if (error) {
    fs.writeFileSync('solicitud_result.txt', `Error: ${JSON.stringify(error)}`);
  } else {
    fs.writeFileSync('solicitud_result.txt', JSON.stringify(solicitudes, null, 2));
  }
}

getId().catch(err => fs.writeFileSync('solicitud_result.txt', `Crash: ${err}`));
