import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticarUsuario() {
  const email = 'blancocasal@gmail.com';
  
  console.log('🔍 DIAGNÓSTICO DE USUARIO\n');
  console.log(`Email: ${email}\n`);
  console.log('='.repeat(80));
  
  // 1. Verificar usuario en tabla users
  console.log('\n1️⃣ DATOS DEL USUARIO\n');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (userError) {
    console.error('❌ Error al obtener usuario:', userError);
    return;
  }
  
  console.log(`   ID: ${user.id}`);
  console.log(`   Nombre: ${user.nombre} ${user.apellidos || ''}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol: ${user.rol}`);
  console.log(`   Estado: ${user.estado}`);
  console.log(`   Email verificado: ${user.email_verificado}`);
  
  // 2. Verificar despachos en user_despachos
  console.log('\n2️⃣ DESPACHOS EN user_despachos\n');
  const { data: userDespachos, error: udError } = await supabase
    .from('user_despachos')
    .select('*')
    .eq('user_id', user.id);
    
  if (udError) {
    console.error('❌ Error:', udError);
  } else {
    console.log(`   Total: ${userDespachos?.length || 0}`);
    if (userDespachos && userDespachos.length > 0) {
      userDespachos.forEach((ud, i) => {
        console.log(`   ${i + 1}. Despacho ID: ${ud.despacho_id}`);
        console.log(`      Asignado: ${new Date(ud.fecha_asignacion).toLocaleString('es-ES')}`);
      });
    } else {
      console.log('   ⚠️ No hay despachos asignados en user_despachos');
    }
  }
  
  // 3. Verificar despachos donde es owner (owner_email)
  console.log('\n3️⃣ DESPACHOS DONDE ES OWNER (owner_email)\n');
  const { data: ownedDespachos, error: ownError } = await supabase
    .from('despachos')
    .select('id, object_id, nombre, owner_email, localidad, provincia')
    .eq('owner_email', email);
    
  if (ownError) {
    console.error('❌ Error:', ownError);
  } else {
    console.log(`   Total: ${ownedDespachos?.length || 0}`);
    if (ownedDespachos && ownedDespachos.length > 0) {
      ownedDespachos.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.nombre}`);
        console.log(`      ID: ${d.id}`);
        console.log(`      Object ID: ${d.object_id}`);
        console.log(`      Ubicación: ${d.localidad}, ${d.provincia}`);
        console.log(`      Owner: ${d.owner_email}`);
      });
    } else {
      console.log('   ⚠️ No hay despachos con owner_email = blancocasal@gmail.com');
    }
  }
  
  // 4. Verificar solicitudes
  console.log('\n4️⃣ SOLICITUDES DE DESPACHO\n');
  const { data: solicitudes, error: solError } = await supabase
    .from('solicitudes_despacho')
    .select(`
      *,
      despacho:despachos(id, nombre, owner_email, localidad, provincia)
    `)
    .eq('user_email', email)
    .order('fecha_solicitud', { ascending: false });
    
  if (solError) {
    console.error('❌ Error:', solError);
  } else {
    console.log(`   Total: ${solicitudes?.length || 0}`);
    if (solicitudes && solicitudes.length > 0) {
      solicitudes.forEach((s, i) => {
        console.log(`   ${i + 1}. ${(s.despacho as any)?.nombre || 'Despacho desconocido'}`);
        console.log(`      Estado: ${s.estado}`);
        console.log(`      Fecha solicitud: ${new Date(s.fecha_solicitud).toLocaleString('es-ES')}`);
        if (s.fecha_respuesta) {
          console.log(`      Fecha respuesta: ${new Date(s.fecha_respuesta).toLocaleString('es-ES')}`);
        }
        console.log(`      Despacho ID: ${s.despacho_id}`);
        console.log(`      Owner actual del despacho: ${(s.despacho as any)?.owner_email || 'Sin owner'}`);
      });
    } else {
      console.log('   ℹ️ No hay solicitudes');
    }
  }
  
  // 5. ANÁLISIS Y RECOMENDACIONES
  console.log('\n5️⃣ ANÁLISIS Y PROBLEMAS DETECTADOS\n');
  
  const problemas: string[] = [];
  
  // Problema 1: Rol incorrecto
  if (user.rol === 'despacho_admin' && (!userDespachos || userDespachos.length === 0) && (!ownedDespachos || ownedDespachos.length === 0)) {
    problemas.push('❌ CRÍTICO: Usuario tiene rol "despacho_admin" pero NO tiene despachos asignados');
    problemas.push('   → El rol debería ser "usuario"');
  }
  
  // Problema 2: Solicitud aprobada sin asignación
  const solicitudesAprobadas = solicitudes?.filter(s => s.estado === 'aprobado') || [];
  if (solicitudesAprobadas.length > 0) {
    solicitudesAprobadas.forEach(s => {
      const despachoId = s.despacho_id;
      const tieneEnUserDespachos = userDespachos?.some(ud => ud.despacho_id === despachoId);
      const esOwner = ownedDespachos?.some(d => d.id === despachoId);
      
      if (!tieneEnUserDespachos && !esOwner) {
        problemas.push(`❌ CRÍTICO: Solicitud aprobada para "${(s.despacho as any)?.nombre}" pero NO está asignado`);
        problemas.push(`   → Despacho ID: ${despachoId}`);
        problemas.push(`   → Falta registro en user_despachos O owner_email en despachos`);
      }
    });
  }
  
  // Problema 3: Owner_email sin user_despachos
  if (ownedDespachos && ownedDespachos.length > 0) {
    ownedDespachos.forEach(d => {
      const tieneEnUserDespachos = userDespachos?.some(ud => ud.despacho_id === d.id);
      if (!tieneEnUserDespachos) {
        problemas.push(`⚠️ ADVERTENCIA: Es owner de "${d.nombre}" pero falta en user_despachos`);
        problemas.push(`   → Despacho ID: ${d.id}`);
      }
    });
  }
  
  if (problemas.length === 0) {
    console.log('   ✅ No se detectaron problemas');
  } else {
    problemas.forEach(p => console.log(`   ${p}`));
  }
  
  // 6. SOLUCIONES PROPUESTAS
  console.log('\n6️⃣ SOLUCIONES PROPUESTAS\n');
  
  if (user.rol === 'despacho_admin' && (!userDespachos || userDespachos.length === 0) && (!ownedDespachos || ownedDespachos.length === 0)) {
    console.log('   1. Cambiar rol a "usuario":');
    console.log('      UPDATE users SET rol = \'usuario\' WHERE email = \'blancocasal@gmail.com\';');
  }
  
  if (solicitudesAprobadas.length > 0) {
    solicitudesAprobadas.forEach(s => {
      const despachoId = s.despacho_id;
      const tieneEnUserDespachos = userDespachos?.some(ud => ud.despacho_id === despachoId);
      const esOwner = ownedDespachos?.some(d => d.id === despachoId);
      
      if (!tieneEnUserDespachos && !esOwner) {
        console.log(`\n   2. Asignar despacho "${(s.despacho as any)?.nombre}":`);
        console.log(`      a) Actualizar owner_email:`);
        console.log(`         UPDATE despachos SET owner_email = 'blancocasal@gmail.com' WHERE id = '${despachoId}';`);
        console.log(`      b) Crear registro en user_despachos:`);
        console.log(`         INSERT INTO user_despachos (user_id, despacho_id) VALUES ('${user.id}', '${despachoId}');`);
        console.log(`      c) Cambiar rol a despacho_admin:`);
        console.log(`         UPDATE users SET rol = 'despacho_admin' WHERE id = '${user.id}';`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

diagnosticarUsuario().catch(console.error);
