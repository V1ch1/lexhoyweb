import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAILS_TO_CHECK = [
  'blancocasal@gmail.com',
  'blancoyenbatea@gmail.com'
];

async function verificarUsuarios() {
  console.log('🔍 VERIFICANDO USUARIOS REGISTRADOS\n');
  
  for (const email of EMAILS_TO_CHECK) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      console.log(`❌ ${email}: No encontrado o error (${error.message})`);
    } else {
      console.log(`✅ ${email}: ENCONTRADO`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Nombre: ${user.nombre} ${user.apellidos || ''}`);
      console.log(`   - Creado: ${user.created_at}`);
    }
  }
}

verificarUsuarios().catch(console.error);
