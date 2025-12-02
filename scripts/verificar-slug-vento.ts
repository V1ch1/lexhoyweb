import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarYCorregirSlug() {
  console.log('🔍 VERIFICACIÓN DE SLUG\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Buscar el despacho Vento
    console.log('\n1️⃣ Buscando despacho Vento en BD...');
    const { data: despachos, error } = await supabase
      .from('despachos')
      .select('id, nombre, slug')
      .ilike('nombre', '%Vento%');
      
    if (error || !despachos || despachos.length === 0) {
      console.error('❌ Error:', error);
      return;
    }
    
    const despacho = despachos[0];
    console.log(`\n   Despacho encontrado:`);
    console.log(`   - Nombre: ${despacho.nombre}`);
    console.log(`   - Slug actual: ${despacho.slug}`);
    console.log(`   - ID: ${despacho.id}`);
    
    // 2. Verificar qué URL se está usando
    console.log(`\n2️⃣ URL que se está intentando acceder:`);
    console.log(`   - /dashboard/despachos/vento-abogados-y-asesores`);
    console.log(`\n   Slug esperado por la URL: vento-abogados-y-asesores`);
    console.log(`   Slug actual en BD: ${despacho.slug}`);
    
    // 3. Decidir corrección
    const slugEsperado = 'vento-abogados-y-asesores';
    
    if (despacho.slug !== slugEsperado) {
      console.log(`\n3️⃣ ⚠️ SLUG NO COINCIDE - Actualizando...`);
      console.log(`   Cambiando de: ${despacho.slug}`);
      console.log(`   A: ${slugEsperado}`);
      
      const { error: updateError } = await supabase
        .from('despachos')
        .update({ slug: slugEsperado })
        .eq('id', despacho.id);
        
      if (updateError) {
        console.error('   ❌ Error al actualizar:', updateError);
      } else {
        console.log('   ✅ Slug actualizado correctamente');
      }
    } else {
      console.log(`\n3️⃣ ✅ Slug ya es correcto`);
    }
    
    // 4. Verificación final
    console.log('\n4️⃣ VERIFICACIÓN FINAL...\n');
    const { data: final } = await supabase
      .from('despachos')
      .select('nombre, slug')
      .eq('id', despacho.id)
      .single();
      
    if (final) {
      console.log(`   Nombre: ${final.nombre}`);
      console.log(`   Slug: ${final.slug}`);
      console.log(`   URL correcta: /dashboard/despachos/${final.slug}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ VERIFICACIÓN COMPLETADA\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

verificarYCorregirSlug().catch(console.error);
