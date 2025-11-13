#!/usr/bin/env node

/**
 * Script de Verificación de Sincronización
 * Verifica que todas las credenciales y configuraciones estén correctas
 * para la sincronización Next.js → WordPress → Algolia
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DE SINCRONIZACIÓN\n');
console.log('='.repeat(60));

let errores = [];
let advertencias = [];
let exitos = [];

// 1. Verificar archivo .env.local
console.log('\n📁 Verificando archivo .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  errores.push('❌ Archivo .env.local NO encontrado');
  console.log('❌ Archivo .env.local NO encontrado');
} else {
  exitos.push('✅ Archivo .env.local encontrado');
  console.log('✅ Archivo .env.local encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variables de WordPress
  console.log('\n🔑 Verificando credenciales de WordPress...');
  
  const wpVars = [
    'WORDPRESS_API_URL',
    'WORDPRESS_USERNAME',
    'WORDPRESS_APPLICATION_PASSWORD'
  ];
  
  wpVars.forEach(varName => {
    if (envContent.includes(varName)) {
      // Verificar que no esté vacía
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && match[1].trim() !== '') {
        exitos.push(`✅ ${varName} configurada`);
        console.log(`✅ ${varName} configurada`);
      } else {
        advertencias.push(`⚠️  ${varName} está vacía`);
        console.log(`⚠️  ${varName} está vacía`);
      }
    } else {
      errores.push(`❌ ${varName} NO encontrada en .env.local`);
      console.log(`❌ ${varName} NO encontrada en .env.local`);
    }
  });
  
  // Verificar variables de Supabase
  console.log('\n🔑 Verificando credenciales de Supabase...');
  
  const supabaseVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  supabaseVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && match[1].trim() !== '') {
        exitos.push(`✅ ${varName} configurada`);
        console.log(`✅ ${varName} configurada`);
      } else {
        advertencias.push(`⚠️  ${varName} está vacía`);
        console.log(`⚠️  ${varName} está vacía`);
      }
    } else {
      errores.push(`❌ ${varName} NO encontrada en .env.local`);
      console.log(`❌ ${varName} NO encontrada en .env.local`);
    }
  });
  
  // Verificar variables de Algolia (opcionales para Next.js)
  console.log('\n🔑 Verificando credenciales de Algolia (opcional)...');
  
  const algoliaVars = [
    'NEXT_PUBLIC_ALGOLIA_APP_ID',
    'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY',
    'ALGOLIA_ADMIN_KEY'
  ];
  
  algoliaVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && match[1].trim() !== '') {
        exitos.push(`✅ ${varName} configurada`);
        console.log(`✅ ${varName} configurada`);
      } else {
        advertencias.push(`⚠️  ${varName} está vacía`);
        console.log(`⚠️  ${varName} está vacía`);
      }
    } else {
      advertencias.push(`⚠️  ${varName} NO encontrada (opcional)`);
      console.log(`⚠️  ${varName} NO encontrada (opcional)`);
    }
  });
}

// 2. Verificar archivo de sincronización
console.log('\n📄 Verificando archivo syncService.ts...');
const syncServicePath = path.join(__dirname, '..', 'lib', 'syncService.ts');

if (!fs.existsSync(syncServicePath)) {
  errores.push('❌ Archivo syncService.ts NO encontrado');
  console.log('❌ Archivo syncService.ts NO encontrado');
} else {
  exitos.push('✅ Archivo syncService.ts encontrado');
  console.log('✅ Archivo syncService.ts encontrado');
  
  const syncContent = fs.readFileSync(syncServicePath, 'utf8');
  
  // Verificar que tiene las funciones necesarias
  const funciones = [
    'enviarDespachoAWordPress',
    'importarDespachoDesdeWordPress',
    'importarSedes'
  ];
  
  funciones.forEach(func => {
    if (syncContent.includes(func)) {
      exitos.push(`✅ Función ${func} encontrada`);
      console.log(`✅ Función ${func} encontrada`);
    } else {
      errores.push(`❌ Función ${func} NO encontrada`);
      console.log(`❌ Función ${func} NO encontrada`);
    }
  });
}

// 3. Verificar endpoint de creación
console.log('\n📄 Verificando endpoint de creación...');
const crearDespachoPath = path.join(__dirname, '..', 'app', 'api', 'crear-despacho', 'route.ts');

if (!fs.existsSync(crearDespachoPath)) {
  errores.push('❌ Archivo crear-despacho/route.ts NO encontrado');
  console.log('❌ Archivo crear-despacho/route.ts NO encontrado');
} else {
  exitos.push('✅ Archivo crear-despacho/route.ts encontrado');
  console.log('✅ Archivo crear-despacho/route.ts encontrado');
  
  const crearContent = fs.readFileSync(crearDespachoPath, 'utf8');
  
  // Verificar que la sincronización está activada
  if (crearContent.includes('SyncService.enviarDespachoAWordPress')) {
    exitos.push('✅ Sincronización con WordPress ACTIVADA');
    console.log('✅ Sincronización con WordPress ACTIVADA');
  } else if (crearContent.includes('Sincronización con WordPress deshabilitada')) {
    errores.push('❌ Sincronización con WordPress DESHABILITADA');
    console.log('❌ Sincronización con WordPress DESHABILITADA');
  } else {
    advertencias.push('⚠️  No se pudo determinar estado de sincronización');
    console.log('⚠️  No se pudo determinar estado de sincronización');
  }
}

// 4. Verificar endpoint de sincronización manual
console.log('\n📄 Verificando endpoint de sincronización manual...');
const syncEndpointPath = path.join(__dirname, '..', 'app', 'api', 'despachos', '[id]', 'sync', 'route.ts');

if (!fs.existsSync(syncEndpointPath)) {
  advertencias.push('⚠️  Endpoint de sincronización manual NO encontrado');
  console.log('⚠️  Endpoint de sincronización manual NO encontrado');
} else {
  exitos.push('✅ Endpoint de sincronización manual encontrado');
  console.log('✅ Endpoint de sincronización manual encontrado');
}

// Resumen
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN DE VERIFICACIÓN\n');

console.log(`✅ Éxitos: ${exitos.length}`);
console.log(`⚠️  Advertencias: ${advertencias.length}`);
console.log(`❌ Errores: ${errores.length}`);

if (errores.length > 0) {
  console.log('\n❌ ERRORES ENCONTRADOS:');
  errores.forEach(err => console.log(`  ${err}`));
}

if (advertencias.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  advertencias.forEach(adv => console.log(`  ${adv}`));
}

console.log('\n' + '='.repeat(60));

// Instrucciones
if (errores.length > 0) {
  console.log('\n🔧 ACCIONES REQUERIDAS:\n');
  
  if (errores.some(e => e.includes('WORDPRESS'))) {
    console.log('1. Configurar credenciales de WordPress en .env.local:');
    console.log('   WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despacho');
    console.log('   WORDPRESS_USERNAME=tu_usuario');
    console.log('   WORDPRESS_APPLICATION_PASSWORD=xxxx-xxxx-xxxx-xxxx');
    console.log('');
    console.log('   Para obtener Application Password:');
    console.log('   - Ir a WordPress Admin → Usuarios → Perfil');
    console.log('   - Scroll hasta "Application Passwords"');
    console.log('   - Crear nueva contraseña');
    console.log('');
  }
  
  if (errores.some(e => e.includes('SUPABASE'))) {
    console.log('2. Configurar credenciales de Supabase en .env.local:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
    console.log('');
  }
  
  if (errores.some(e => e.includes('DESHABILITADA'))) {
    console.log('3. Activar sincronización en app/api/crear-despacho/route.ts');
    console.log('   (Ya debería estar activada si ejecutaste los cambios)');
    console.log('');
  }
  
  console.log('Después de realizar los cambios, ejecuta este script nuevamente.');
  process.exit(1);
} else {
  console.log('\n✅ CONFIGURACIÓN CORRECTA\n');
  console.log('La sincronización está lista para funcionar.');
  console.log('');
  console.log('📝 Próximos pasos:');
  console.log('1. Ejecutar pruebas manuales (ver PRUEBAS_SINCRONIZACION.md)');
  console.log('2. Verificar logs en WordPress (wp-content/lexhoy-debug.log)');
  console.log('3. Monitorear sincronización en Algolia Dashboard');
  console.log('');
  process.exit(0);
}
