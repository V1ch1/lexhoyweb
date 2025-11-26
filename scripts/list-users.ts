/**
 * Script para limpiar usuarios huérfanos en Supabase
 * (usuarios que existen en Supabase pero fueron eliminados de Clerk)
 * 
 * IMPORTANTE: Este script SOLO muestra los usuarios huérfanos.
 * Para eliminarlos, descomenta la sección de eliminación.
 * 
 * Uso: npx tsx scripts/cleanup-orphaned-users-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAllUsers() {
  console.log('🔍 Listando todos los usuarios en Supabase...\n');

  try {
    // Obtener todos los usuarios de Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('id, email, nombre, apellidos, rol, activo, fecha_registro')
      .order('fecha_registro', { ascending: false });

    if (supabaseError) {
      console.error('❌ Error al obtener usuarios de Supabase:', supabaseError);
      return;
    }

    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('✅ No hay usuarios en Supabase');
      return;
    }

    console.log(`📊 Total usuarios en Supabase: ${supabaseUsers.length}\n`);
    console.log('═'.repeat(80));
    console.log('LISTA DE USUARIOS:');
    console.log('═'.repeat(80));

    supabaseUsers.forEach((user, index) => {
      const status = user.activo ? '✅ Activo' : '❌ Inactivo';
      const fecha = new Date(user.fecha_registro).toLocaleDateString('es-ES');
      
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellidos}`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Registro: ${fecha}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n📝 INSTRUCCIONES PARA LIMPIAR:');
    console.log('\n1. Ve a Clerk Dashboard: https://dashboard.clerk.com/');
    console.log('2. Verifica qué usuarios existen en Clerk');
    console.log('3. Para eliminar un usuario de Supabase, usa:');
    console.log('\n   DELETE FROM users WHERE email = \'email@example.com\';');
    console.log('\n4. O ejecuta el script de eliminación interactivo:');
    console.log('   npx tsx scripts/delete-user.ts email@example.com');
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
listAllUsers()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
