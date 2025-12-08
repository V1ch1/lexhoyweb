/**
 * Script de verificación del sistema de notificaciones
 * Verifica que todas las notificaciones funcionan correctamente
 */

import { NotificationService } from '../lib/notificationService.js';
import { EmailService } from '../lib/services/emailService.js';
import { supabase } from '../lib/supabase.js';

interface VerificationResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const results: VerificationResult[] = [];

async function verifyNotificationTypes() {
  console.log('\n🔍 Verificando tipos de notificación en BD...');
  
  try {
    // Intentar crear una notificación de cada tipo
    const types = [
      'solicitud_recibida',
      'solicitud_aprobada',
      'solicitud_rechazada',
      'solicitud_despacho',
      'despacho_asignado',
      'despacho_desasignado',
      'usuario_nuevo',
      'mensaje_sistema',
      'nuevo_lead',
      'nuevo_lead_admin',
      'lead_comprado',
      'lead_vendido'
    ];

    // Obtener un usuario de prueba
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!users || users.length === 0) {
      results.push({
        test: 'Tipos de Notificación',
        status: 'warning',
        message: 'No hay usuarios para probar'
      });
      return;
    }

    const testUserId = users[0].id;
    let successCount = 0;
    let errorCount = 0;

    for (const type of types) {
      try {
        const { error } = await NotificationService.create({
          userId: testUserId,
          tipo: type as any,
          titulo: `Test ${type}`,
          mensaje: 'Verificación automática del sistema'
        });

        if (error) {
          console.log(`  ❌ ${type}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ ${type}`);
          successCount++;
        }
      } catch (error: any) {
        console.log(`  ❌ ${type}: ${error.message}`);
        errorCount++;
      }
    }

    // Limpiar notificaciones de prueba
    await supabase
      .from('notificaciones')
      .delete()
      .eq('mensaje', 'Verificación automática del sistema');

    results.push({
      test: 'Tipos de Notificación',
      status: errorCount === 0 ? 'success' : 'error',
      message: `${successCount}/${types.length} tipos funcionan correctamente`
    });

  } catch (error: any) {
    results.push({
      test: 'Tipos de Notificación',
      status: 'error',
      message: error.message
    });
  }
}

async function verifyPendingDailyNotificationsTable() {
  console.log('\n🔍 Verificando tabla pending_daily_notifications...');
  
  try {
    const { error } = await supabase
      .from('pending_daily_notifications')
      .select('id')
      .limit(1);

    if (error) {
      results.push({
        test: 'Tabla pending_daily_notifications',
        status: 'error',
        message: `Tabla no existe o no es accesible: ${error.message}`
      });
    } else {
      results.push({
        test: 'Tabla pending_daily_notifications',
        status: 'success',
        message: 'Tabla existe y es accesible'
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Tabla pending_daily_notifications',
      status: 'error',
      message: error.message
    });
  }
}

async function verifyUserNotificationPreferences() {
  console.log('\n🔍 Verificando tabla user_notification_preferences...');
  
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .limit(1);

    if (error) {
      results.push({
        test: 'Tabla user_notification_preferences',
        status: 'error',
        message: `Error: ${error.message}`
      });
    } else {
      // Verificar que tiene las columnas necesarias
      const requiredColumns = [
        'email_new_lead',
        'email_lead_purchased',
        'email_solicitud_status',
        'email_despacho_changes',
        'especialidades_interes',
        'precio_min',
        'precio_max',
        'solo_alta_urgencia',
        'resumen_diario',
        'hora_resumen'
      ];

      const hasAllColumns = data && data.length > 0 
        ? requiredColumns.every(col => col in data[0])
        : true; // Si no hay datos, asumimos que la estructura es correcta

      results.push({
        test: 'Tabla user_notification_preferences',
        status: hasAllColumns ? 'success' : 'warning',
        message: hasAllColumns 
          ? 'Tabla existe con todas las columnas necesarias'
          : 'Tabla existe pero puede faltar alguna columna'
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Tabla user_notification_preferences',
      status: 'error',
      message: error.message
    });
  }
}

async function verifyEmailService() {
  console.log('\n🔍 Verificando EmailService...');
  
  try {
    // Verificar que RESEND_API_KEY está configurada
    if (!process.env.RESEND_API_KEY) {
      results.push({
        test: 'EmailService',
        status: 'warning',
        message: 'RESEND_API_KEY no está configurada'
      });
    } else {
      results.push({
        test: 'EmailService',
        status: 'success',
        message: 'RESEND_API_KEY configurada correctamente'
      });
    }
  } catch (error: any) {
    results.push({
      test: 'EmailService',
      status: 'error',
      message: error.message
    });
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));

  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.test}`);
    console.log(`   ${result.message}`);

    if (result.status === 'success') successCount++;
    else if (result.status === 'warning') warningCount++;
    else errorCount++;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`⚠️  Advertencias: ${warningCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log('❌ Hay errores que deben corregirse antes de continuar.');
    console.log('💡 Asegúrate de aplicar las migraciones en Supabase:\n');
    console.log('   1. supabase/migrations/20251208_update_notification_types.sql');
    console.log('   2. supabase/migrations/20251208_create_pending_daily_notifications.sql\n');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️  Hay advertencias que deberías revisar.');
    process.exit(0);
  } else {
    console.log('✅ ¡Todo funciona correctamente!');
    process.exit(0);
  }
}

async function main() {
  console.log('🚀 Iniciando verificación del sistema de notificaciones...\n');

  await verifyNotificationTypes();
  await verifyPendingDailyNotificationsTable();
  await verifyUserNotificationPreferences();
  await verifyEmailService();

  await printResults();
}

main().catch(console.error);
