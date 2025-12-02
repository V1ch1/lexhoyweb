import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para generar slug
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function corregirSlugVento() {
  console.log('🔧 CORRECCIÓN DE SLUG - Vento Abogados\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Buscar el despacho Vento
    console.log('\n1️⃣ Buscando despacho Vento...');
    const { data: despachos, error: searchError } = await supabase
      .from('despachos')
      .select('id, nombre, slug, owner_email')
      .ilike('nombre', '%Vento%');
      
    if (searchError || !despachos || despachos.length === 0) {
      console.error('❌ Error al buscar despacho:', searchError);
      return;
    }
    
    const despacho = despachos[0];
    console.log(`   ✅ Despacho encontrado: ${despacho.nombre}`);
    console.log(`   ID: ${despacho.id}`);
    console.log(`   Slug actual: ${despacho.slug || 'NULL'}`);
    console.log(`   Owner: ${despacho.owner_email || 'Sin owner'}`);
    
    // 2. Generar slug correcto
    const slugCorrecto = slugify(despacho.nombre);
    console.log(`\n2️⃣ Slug correcto debería ser: ${slugCorrecto}`);
    
    // 3. Actualizar si es necesario
    if (despacho.slug !== slugCorrecto) {
      console.log('\n3️⃣ Actualizando slug...');
      const { error: updateError } = await supabase
        .from('despachos')
        .update({ slug: slugCorrecto })
        .eq('id', despacho.id);
        
      if (updateError) {
        console.error('   ❌ Error al actualizar:', updateError);
      } else {
        console.log('   ✅ Slug actualizado correctamente');
      }
    } else {
      console.log('\n3️⃣ El slug ya es correcto, no se necesita actualización');
    }
    
    // 4. Verificación final
    console.log('\n4️⃣ VERIFICACIÓN FINAL...\n');
    const { data: despachoFinal } = await supabase
      .from('despachos')
      .select('id, nombre, slug, owner_email')
      .eq('id', despacho.id)
      .single();
      
    if (despachoFinal) {
      console.log('   Estado final:');
      console.log(`   - Nombre: ${despachoFinal.nombre}`);
      console.log(`   - Slug: ${despachoFinal.slug}`);
      console.log(`   - Owner: ${despachoFinal.owner_email}`);
      console.log(`   - URL: /dashboard/despachos/${despachoFinal.slug}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ CORRECCIÓN COMPLETADA\n');
    
  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error);
  }
}

corregirSlugVento().catch(console.error);
