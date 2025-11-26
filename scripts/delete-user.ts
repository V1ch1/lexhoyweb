/**
 * Script para eliminar un usuario específico de Supabase
 * 
 * Uso: npx tsx scripts/delete-user.ts email@example.com
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteUser(email: string) {
  console.log(`🗑️  Eliminando usuario: ${email}\n`);

  try {
    // 1. Buscar usuario
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error(`❌ Usuario no encontrado: ${email}`);
      return;
    }

    console.log('📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.nombre} ${user.apellidos}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Activo: ${user.activo}`);

    // 2. Eliminar usuario
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error(`\n❌ Error al eliminar usuario:`, deleteError);
      return;
    }

    console.log(`\n✅ Usuario eliminado exitosamente: ${email}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Obtener email de argumentos
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Debes proporcionar un email');
  console.log('\nUso: npx tsx scripts/delete-user.ts email@example.com');
  process.exit(1);
}

// Ejecutar
deleteUser(email)
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
