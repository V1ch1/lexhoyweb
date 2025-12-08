/**
 * Script de prueba completo del sistema de notificaciones
 * Crea notificaciones de prueba para cada tipo y rol
 */

import { supabase } from '../lib/supabase.js';

interface TestResult {
  tipo: string;
  rol: string;
  status: 'success' | 'error';
  message: string;
}

const results: TestResult[] = [];

// Tipos de notificación por rol
const notificationsByRole = {
  super_admin: [
    { tipo: 'solicitud_despacho', titulo: '🔔 Nueva Solicitud de Despacho', mensaje: 'El usuario Juan Pérez ha solicitado acceso al despacho "Bufete Legal Madrid"' },
    { tipo: 'usuario_nuevo', titulo: '👤 Nuevo Usuario Registrado', mensaje: 'María García se ha registrado en la plataforma' },
    { tipo: 'nuevo_lead_admin', titulo: '📊 Nuevo Lead Procesado', mensaje: 'Lead "Divorcio express" procesado. Especialidad: Derecho de Familia. Calidad: 85/100' },
    { tipo: 'lead_vendido', titulo: '💰 Lead Vendido', mensaje: 'El lead "Reclamación laboral" ha sido vendido por 150€' }
  ],
  despacho_admin: [
    { tipo: 'nuevo_lead', titulo: '🎯 Nuevo Lead Disponible', mensaje: 'Nuevo lead de Derecho Mercantil disponible. Urgencia: Alta. Precio: 200€' },
    { tipo: 'lead_comprado', titulo: '✅ Lead Adquirido', mensaje: 'Has comprado el lead "Constitución de sociedad" por 180€' },
    { tipo: 'despacho_asignado', titulo: '👑 Asignado como Propietario', mensaje: 'Has sido asignado como propietario del despacho "Abogados Asociados"' },
    { tipo: 'despacho_desasignado', titulo: '🔄 Cambio de Propiedad', mensaje: 'Has dejado de ser propietario del despacho "Legal Partners"' }
  ],
  usuario: [
    { tipo: 'solicitud_recibida', titulo: '📋 Solicitud Recibida', mensaje: 'Hemos recibido tu solicitud para el despacho "Despacho Jurídico Central"' },
    { tipo: 'solicitud_aprobada', titulo: '🎉 Solicitud Aprobada', mensaje: 'Tu solicitud para "Bufete Internacional" ha sido aprobada' },
    { tipo: 'solicitud_rechazada', titulo: '❌ Solicitud No Aprobada', mensaje: 'Tu solicitud para "Asesoría Legal" no ha sido aprobada' },
    { tipo: 'mensaje_sistema', titulo: '📢 Mensaje del Sistema', mensaje: 'Mantenimiento programado el próximo domingo de 2:00 a 4:00 AM' }
  ]
};

async function createTestNotifications() {
  console.log('🚀 Iniciando creación de notificaciones de prueba...\n');

  // Obtener usuarios de cada rol
  const { data: users } = await supabase
    .from('users')
    .select('id, email, rol')
    .in('rol', ['super_admin', 'despacho_admin', 'usuario']);

  if (!users || users.length === 0) {
    console.log('❌ No se encontraron usuarios para probar');
    return;
  }

  // Agrupar usuarios por rol
  const usersByRole: Record<string, any[]> = {
    super_admin: users.filter(u => u.rol === 'super_admin'),
    despacho_admin: users.filter(u => u.rol === 'despacho_admin'),
    usuario: users.filter(u => u.rol === 'usuario')
  };

  // Crear notificaciones para cada rol
  for (const [rol, notifications] of Object.entries(notificationsByRole)) {
    const usersForRole = usersByRole[rol];
    
    if (!usersForRole || usersForRole.length === 0) {
      console.log(`⚠️  No hay usuarios con rol "${rol}" para probar`);
      continue;
    }

    const testUser = usersForRole[0];
    console.log(`\n📝 Creando notificaciones para ${rol} (${testUser.email}):`);

    for (const notification of notifications) {
      try {
        const { error } = await supabase
          .from('notificaciones')
          .insert({
            user_id: testUser.id,
            tipo: notification.tipo,
            titulo: notification.titulo,
            mensaje: notification.mensaje,
            leida: false,
            metadata: { test: true, created_by: 'test_script' }
          });

        if (error) {
          console.log(`  ❌ ${notification.tipo}: ${error.message}`);
          results.push({
            tipo: notification.tipo,
            rol,
            status: 'error',
            message: error.message
          });
        } else {
          console.log(`  ✅ ${notification.tipo}: ${notification.titulo}`);
          results.push({
            tipo: notification.tipo,
            rol,
            status: 'success',
            message: 'Creada correctamente'
          });
        }
      } catch (error: any) {
        console.log(`  ❌ ${notification.tipo}: ${error.message}`);
        results.push({
          tipo: notification.tipo,
          rol,
          status: 'error',
          message: error.message
        });
      }
    }
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`\n✅ Exitosas: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📝 Total: ${results.length}`);

  if (errorCount > 0) {
    console.log('\n❌ Errores encontrados:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.tipo} (${r.rol}): ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Ahora puedes:');
  console.log('   1. Iniciar sesión con cada tipo de usuario');
  console.log('   2. Ver las notificaciones en la campana 🔔');
  console.log('   3. Verificar que cada notificación aparece correctamente');
  console.log('\n🗑️  Para limpiar las notificaciones de prueba, ejecuta:');
  console.log('   npx tsx scripts/limpiar-notificaciones-prueba.ts\n');
}

async function main() {
  await createTestNotifications();
  await printSummary();
}

main().catch(console.error);
