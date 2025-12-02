import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAILS_TO_DELETE = [
  'blancocasal@gmail.com',
  'blancoyenbatea@gmail.com'
];

async function borrarUsuarios() {
  console.log('🗑️ BORRADO DE USUARIOS DE PRUEBA\n');
  console.log('='.repeat(80));

  for (const email of EMAILS_TO_DELETE) {
    console.log(`\n🔍 Procesando: ${email}`);
    
    // 1. Buscar usuario por email en auth.users (usando admin API)
    // Nota: listUsers no permite filtrar por email directamente de forma eficiente en todas las versiones,
    // pero podemos listar y buscar o usar getUserById si tuviéramos el ID.
    // Como no tenemos ID, vamos a buscar en la tabla public.users primero para obtener el ID,
    // ya que auth.users no es directamente consultable con select() simple sin admin.
    
    // Sin embargo, admin.listUsers() es lo correcto.
    
    // Estrategia: Buscar en public.users para obtener el ID (que coincide con auth.users.id)
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    let userId = publicUser?.id;

    if (!userId) {
        console.log('   ⚠️ No encontrado en public.users. Intentando buscar en auth via listUsers...');
        // Fallback: listar usuarios (esto puede ser lento si hay muchos, pero para dev está bien)
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('   ❌ Error listando usuarios:', listError);
            continue;
        }
        const authUser = (users as any[]).find(u => u.email === email);
        userId = authUser?.id;
    }

    if (!userId) {
      console.log('   ❌ Usuario no encontrado en el sistema.');
      continue;
    }

    console.log(`   🆔 ID encontrado: ${userId}`);

    // 2. Eliminar usuario (esto debería borrar en cascada en public.users si está configurado,
    // pero por seguridad borraremos relaciones primero si es necesario, aunque el cascade suele ser automático)
    
    console.log('   🗑️ Eliminando usuario de Auth (y cascada)...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('   ❌ Error al eliminar:', deleteError.message);
    } else {
      console.log('   ✅ Usuario eliminado correctamente.');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ PROCESO COMPLETADO\n');
}

borrarUsuarios().catch(console.error);
