/**
 * Script para limpiar notificaciones de prueba
 */

import { supabase } from '../lib/supabase.js';

async function cleanupTestNotifications() {
  console.log('🗑️  Limpiando notificaciones de prueba...\n');

  const { data, error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('metadata->>test', 'true')
    .select();

  if (error) {
    console.log('❌ Error al limpiar:', error.message);
    return;
  }

  console.log(`✅ ${data?.length || 0} notificaciones de prueba eliminadas\n`);
}

cleanupTestNotifications().catch(console.error);
