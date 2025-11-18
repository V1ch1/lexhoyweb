import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oepcitgbnqylfpdryffx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcGNpdGdibnF5bGZwZHJ5ZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzEwNzYsImV4cCI6MjA3NDEwNzA3Nn0.jjTweQk3kl3V4VQ6aZM6zLPU2j4ntT1qJ1ZmVHPQAaw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificados() {
  console.log('Verificando despachos...\n');
  
  // Ver todos los valores posibles de estado_verificacion
  const { data: all } = await supabase
    .from('despachos')
    .select('id, nombre, estado_verificacion')
    .limit(10);
    
  console.log('Primeros 10 despachos:');
  all?.forEach(d => {
    console.log(- : estado_verificacion = '');
  });
  
  // Contar por estado
  const { data: allStates } = await supabase
    .from('despachos')
    .select('estado_verificacion');
    
  const counts = {};
  allStates?.forEach(d => {
    const state = d.estado_verificacion || 'null';
    counts[state] = (counts[state] || 0) + 1;
  });
  
  console.log('\nContadores por estado:');
  Object.entries(counts).forEach(([state, count]) => {
    console.log(  : );
  });
  
  // Buscar específicamente "verificado"
  const { count: countVerificado } = await supabase
    .from('despachos')
    .select('*', { count: 'exact', head: true })
    .eq('estado_verificacion', 'verificado');
    
  console.log(\nDespachos con estado_verificacion = 'verificado': );
  
  // Buscar Vento específicamente
  const { data: vento } = await supabase
    .from('despachos')
    .select('id, nombre, estado_verificacion, wordpress_id')
    .ilike('nombre', '%vento%');
    
  console.log('\nBúsqueda de Vento:');
  vento?.forEach(d => {
    console.log(- :  (WP ID: ));
  });
}

checkVerificados().catch(console.error);
