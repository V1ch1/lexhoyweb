import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function corregirUsuarioYDespacho() {
  const email = 'blancocasal@gmail.com';
  
  console.log('🔧 CORRECCIÓN DE PROBLEMAS CRÍTICOS\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Obtener usuario
    console.log('\n1️⃣ Obteniendo datos del usuario...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (userError || !user) {
      console.error('❌ Error al obtener usuario:', userError);
      return;
    }
    
    console.log(`   ✅ Usuario encontrado: ${user.nombre} ${user.apellidos || ''}`);
    console.log(`   Rol actual: ${user.rol}`);
    
    // 2. Buscar despacho Vento
    console.log('\n2️⃣ Buscando despacho "Vento Abogados"...');
    const { data: despachos, error: despachosError } = await supabase
      .from('despachos')
      .select('id, object_id, nombre, owner_email')
      .ilike('nombre', '%Vento%');
      
    if (despachosError || !despachos || despachos.length === 0) {
      console.error('❌ Error al buscar despacho:', despachosError);
      return;
    }
    
    const despacho = despachos[0];
    console.log(`   ✅ Despacho encontrado: ${despacho.nombre}`);
    console.log(`   ID: ${despacho.id}`);
    console.log(`   Owner actual: ${despacho.owner_email || 'Sin owner'}`);
    
    // 3. Verificar solicitud
    console.log('\n3️⃣ Verificando solicitud...');
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_despacho')
      .select('*')
      .eq('user_email', email)
      .eq('despacho_id', despacho.id)
      .single();
      
    if (solError) {
      console.log('   ⚠️ No se encontró solicitud (puede ser normal)');
    } else {
      console.log(`   ✅ Solicitud encontrada - Estado: ${solicitud.estado}`);
    }
    
    // 4. Verificar si ya existe en user_despachos
    console.log('\n4️⃣ Verificando asignación actual...');
    const { data: existingAssignment, error: assignError } = await supabase
      .from('user_despachos')
      .select('*')
      .eq('user_id', user.id)
      .eq('despacho_id', despacho.id)
      .single();
      
    if (existingAssignment) {
      console.log('   ℹ️ Ya existe asignación en user_despachos');
    } else {
      console.log('   ⚠️ NO existe asignación en user_despachos');
    }
    
    // 5. CORRECCIONES
    console.log('\n5️⃣ APLICANDO CORRECCIONES...\n');
    
    let cambiosRealizados = 0;
    
    // 5.1 Actualizar owner_email en despachos
    if (despacho.owner_email !== email) {
      console.log('   📝 Actualizando owner_email en despachos...');
      const { error: updateOwnerError } = await supabase
        .from('despachos')
        .update({ owner_email: email })
        .eq('id', despacho.id);
        
      if (updateOwnerError) {
        console.error('   ❌ Error:', updateOwnerError);
      } else {
        console.log('   ✅ owner_email actualizado');
        cambiosRealizados++;
      }
    } else {
      console.log('   ℹ️ owner_email ya está correcto');
    }
    
    // 5.2 Crear registro en user_despachos si no existe
    if (!existingAssignment) {
      console.log('   📝 Creando registro en user_despachos...');
      const { error: insertError } = await supabase
        .from('user_despachos')
        .insert({
          user_id: user.id,
          despacho_id: despacho.id,
          fecha_asignacion: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('   ❌ Error:', insertError);
      } else {
        console.log('   ✅ Registro creado en user_despachos');
        cambiosRealizados++;
      }
    } else {
      console.log('   ℹ️ Registro en user_despachos ya existe');
    }
    
    // 5.3 Actualizar rol a despacho_admin
    if (user.rol !== 'despacho_admin') {
      console.log('   📝 Actualizando rol a despacho_admin...');
      const { error: updateRolError } = await supabase
        .from('users')
        .update({ rol: 'despacho_admin' })
        .eq('id', user.id);
        
      if (updateRolError) {
        console.error('   ❌ Error:', updateRolError);
      } else {
        console.log('   ✅ Rol actualizado a despacho_admin');
        cambiosRealizados++;
      }
    } else {
      console.log('   ℹ️ Rol ya es despacho_admin');
    }
    
    // 5.4 Actualizar solicitud a aprobado si existe y no está aprobada
    if (solicitud && solicitud.estado !== 'aprobado') {
      console.log('   📝 Actualizando solicitud a aprobado...');
      const { error: updateSolError } = await supabase
        .from('solicitudes_despacho')
        .update({
          estado: 'aprobado',
          fecha_respuesta: new Date().toISOString(),
          notas_respuesta: 'Solicitud aprobada automáticamente durante corrección de datos'
        })
        .eq('id', solicitud.id);
        
      if (updateSolError) {
        console.error('   ❌ Error:', updateSolError);
      } else {
        console.log('   ✅ Solicitud actualizada a aprobado');
        cambiosRealizados++;
      }
    }
    
    // 6. VERIFICACIÓN FINAL
    console.log('\n6️⃣ VERIFICACIÓN FINAL...\n');
    
    const { data: userFinal } = await supabase
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single();
      
    const { data: despachoFinal } = await supabase
      .from('despachos')
      .select('owner_email')
      .eq('id', despacho.id)
      .single();
      
    const { data: assignmentFinal } = await supabase
      .from('user_despachos')
      .select('*')
      .eq('user_id', user.id)
      .eq('despacho_id', despacho.id)
      .single();
      
    console.log('   Estado final:');
    console.log(`   - Usuario rol: ${userFinal?.rol}`);
    console.log(`   - Despacho owner_email: ${despachoFinal?.owner_email}`);
    console.log(`   - Registro en user_despachos: ${assignmentFinal ? '✅ Existe' : '❌ No existe'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ CORRECCIÓN COMPLETADA - ${cambiosRealizados} cambios realizados\n`);
    
    if (cambiosRealizados === 0) {
      console.log('ℹ️ No se necesitaron cambios, todo ya estaba correcto');
    } else {
      console.log('🎉 Problemas corregidos exitosamente');
      console.log('\nPróximos pasos:');
      console.log('1. Recargar la página en el navegador');
      console.log('2. Verificar que el despacho aparece en /dashboard/despachos/mis-despachos');
      console.log('3. Verificar que el rol se muestra correctamente');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error);
  }
}

corregirUsuarioYDespacho().catch(console.error);
