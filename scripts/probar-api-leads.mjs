import fetch from 'node-fetch';

const API_URL = 'https://apibacklexhoy.onrender.com/api/leads';

// Lead de prueba
const leadPrueba = {
  nombre: "Juan Pérez Test",
  correo: "juan.test@example.com",
  telefono: "+34 612 345 678",
  cuerpoMensaje: "Necesito asesoramiento legal urgente sobre un despido improcedente. Me han despedido de mi empresa sin previo aviso y creo que no han seguido el procedimiento correcto. Llevo 5 años trabajando allí.",
  urlPagina: "https://lexhoy.com/abogado-laboral-madrid",
  tituloPost: "Abogado Laboral en Madrid - Despidos y Contratos",
  checkbox: true
};

async function probarAPI() {
  console.log('🧪 PROBANDO API DE LEADS\n');
  console.log('📍 URL:', API_URL);
  console.log('📝 Lead de prueba:', JSON.stringify(leadPrueba, null, 2));
  console.log('\n⏳ Enviando...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPrueba)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ ÉXITO - Lead creado correctamente\n');
      console.log('📊 Respuesta de la API:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🎯 Datos del lead:');
      console.log(`   - ID: ${data.lead?.id || 'N/A'}`);
      console.log(`   - Especialidad detectada: ${data.lead?.especialidad || 'N/A'}`);
      console.log(`   - Urgencia: ${data.lead?.urgencia || 'N/A'}`);
      console.log(`   - Precio estimado: ${data.lead?.precio_estimado || 'N/A'}€`);
      console.log('\n✅ Ahora verifica en Supabase que el lead se guardó correctamente');
      console.log('✅ Y revisa si llegó notificación a los despacho_admin en el dashboard');
    } else {
      console.log('❌ ERROR - La API devolvió un error\n');
      console.log(`   Status: ${response.status}`);
      console.log(`   Respuesta:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('💥 ERROR - No se pudo conectar con la API\n');
    console.error(error);
    console.log('\n⚠️ Verifica que:');
    console.log('   1. Render está corriendo correctamente');
    console.log('   2. La URL de la API es correcta');
    console.log('   3. No hay errores en los logs de Render');
  }
}

probarAPI();
