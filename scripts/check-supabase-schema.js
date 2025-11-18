import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oepcitgbnqylfpdryffx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcGNpdGdibnF5bGZwZHJ5ZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzEwNzYsImV4cCI6MjA3NDEwNzA3Nn0.jjTweQk3kl3V4VQ6aZM6zLPU2j4ntT1qJ1ZmVHPQAaw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Verificando estructura de tabla despachos...\n');
  
  // Intentar insertar un registro con todos los campos posibles y ver cuál falla
  const testData = {
    object_id: 'test_' + Date.now(),
    wordpress_id: 999999,
    nombre: 'Test Despacho',
    slug: 'test-despacho-' + Date.now(),
    descripcion: 'Test descripcion',
    owner_email: 'test@test.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    verificado: false,
    activo: true,
    sincronizado_wp: true,
    direccion: 'Test direccion',
    email: 'test@test.com',
    telefono: '123456789',
    web: 'https://test.com'
  };
  
  console.log('Intentando insertar con todos los campos:', Object.keys(testData).join(', '));
  console.log('');
  
  const { data, error } = await supabase
    .from('despachos')
    .insert([testData])
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Code:', error.code);
    console.log('');
    
    // Ahora intentemos con campos básicos solamente
    console.log('Probando con campos básicos...');
    const basicData = {
      wordpress_id: 999998 + Math.floor(Math.random() * 1000),
      nombre: 'Test Despacho Basic',
      slug: 'test-despacho-basic-' + Date.now(),
    };
    
    const { data: basicResult, error: basicError } = await supabase
      .from('despachos')
      .insert([basicData])
      .select();
    
    if (basicError) {
      console.log('❌ Error con campos básicos:', basicError.message);
    } else {
      console.log('✅ Insert exitoso con campos básicos!');
      console.log('Datos insertados:', basicResult);
      
      // Limpiar
      if (basicResult && basicResult[0]) {
        await supabase.from('despachos').delete().eq('id', basicResult[0].id);
        console.log('🧹 Registro de prueba eliminado');
      }
    }
  } else {
    console.log('✅ Insert exitoso con todos los campos!');
    console.log('Datos insertados:', data);
    
    // Limpiar
    if (data && data[0]) {
      await supabase.from('despachos').delete().eq('id', data[0].id);
      console.log('🧹 Registro de prueba eliminado');
    }
  }
  
  // Ahora obtengamos un despacho real para ver qué campos tiene
  console.log('\n📋 Obteniendo un despacho real para ver su estructura...\n');
  const { data: realDespachos, error: realError } = await supabase
    .from('despachos')
    .select('*')
    .limit(1);
  
  const realDespacho = realDespachos && realDespachos[0];
  
  if (realError) {
    console.log('❌ Error obteniendo despacho real:', realError.message);
  } else if (realDespacho) {
    console.log('✅ Campos reales de la tabla despachos:');
    console.log(Object.keys(realDespacho).sort().join('\n'));
  } else {
    console.log('⚠️ No hay despachos en la base de datos');
  }
}

checkSchema().catch(console.error);
