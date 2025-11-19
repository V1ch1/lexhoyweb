/**
 * Script standalone para sincronizar Vento
 * NO requiere el servidor Next.js
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const VENTO_ID = '33792fd3-4f9a-412a-a399-c10f63c675f9';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WP_API_URL = 'https://lexhoy.com/wp-json/wp/v2/despacho';
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_PASSWORD = process.env.WORDPRESS_APPLICATION_PASSWORD;
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY;

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 SINCRONIZACIÓN COMPLETA DE VENTO - STANDALONE');
  console.log('='.repeat(70));
  console.log('');

  try {
    // PASO 1: Obtener desde Supabase
    console.log('📊 PASO 1: Obteniendo desde Supabase...');
    console.log('-'.repeat(70));

    const supabaseHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };

    // Obtener despacho
    const despachoResp = await fetch(
      `${SUPABASE_URL}/rest/v1/despachos?id=eq.${VENTO_ID}&select=*`,
      { headers: supabaseHeaders }
    );
    const [despacho] = await despachoResp.json();

    if (!despacho) {
      throw new Error('Despacho no encontrado en Supabase');
    }

    console.log(`✅ Despacho: ${despacho.nombre}`);
    console.log(`   Estado verificación: ${despacho.estado_verificacion}`);
    console.log(`   WordPress ID: ${despacho.wordpress_id}`);

    // Obtener sedes
    const sedesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/sedes?despacho_id=eq.${VENTO_ID}&select=*&order=es_principal.desc`,
      { headers: supabaseHeaders }
    );
    const sedes = await sedesResp.json();

    console.log(`✅ Sedes encontradas: ${sedes.length}`);
    sedes.forEach((sede, i) => {
      console.log(`      ${i + 1}. ${sede.nombre} (${sede.localidad}, ${sede.provincia})`);
    });

    // PASO 2: Preparar payload para WordPress
    console.log('\n📤 PASO 2: Preparando payload para WordPress...');
    console.log('-'.repeat(70));

    const sedePrincipal = sedes.find(s => s.es_principal) || sedes[0];
    const descripcion = despacho.descripcion || sedePrincipal?.descripcion || `<p>${despacho.nombre} es un despacho de abogados.</p>`;

    const sedesPayload = sedes.map((sede) => {
      const direccionPartes = [
        sede.calle && sede.numero ? `${sede.calle} ${sede.numero}` : sede.calle,
        sede.piso,
        sede.localidad,
        sede.provincia,
        sede.codigo_postal ? `(${sede.codigo_postal})` : ''
      ].filter(Boolean);

      return {
        nombre: sede.nombre || '',
        descripcion: sede.descripcion || '',
        localidad: sede.localidad || '',
        provincia: sede.provincia || '',
        pais: sede.pais || 'España',
        direccion: direccionPartes.join(', '),
        calle: sede.calle || '',
        numero: sede.numero || '',
        piso: sede.piso || '',
        codigo_postal: sede.codigo_postal || '',
        telefono: sede.telefono || '',
        email: sede.email_contacto || '',
        email_contacto: sede.email_contacto || '',
        web: sede.web || '',
        persona_contacto: sede.persona_contacto || '',
        ano_fundacion: sede.ano_fundacion || null,
        año_fundacion: sede.ano_fundacion || null,
        tamano_despacho: sede.tamano_despacho || '',
        tamaño_despacho: sede.tamano_despacho || '',
        numero_colegiado: sede.numero_colegiado || '',
        colegio: sede.colegio || '',
        experiencia: sede.experiencia || '',
        areas_practica: sede.areas_practica || [],
        especialidades: sede.especialidades || '',
        servicios_especificos: sede.servicios_especificos || '',
        foto_perfil: sede.foto_perfil?.startsWith('http') ? sede.foto_perfil : null,
        horarios: sede.horarios || {},
        redes_sociales: sede.redes_sociales || {},
        observaciones: sede.observaciones || '',
        es_principal: sede.es_principal || false,
        activa: sede.activa !== false,
        // CRÍTICO: Usar estado del DESPACHO
        estado_verificacion: despacho.estado_verificacion || 'pendiente',
        estado_registro: sede.estado_registro || 'activo',
        is_verified: despacho.estado_verificacion === 'verificado'
      };
    });

    console.log(`✅ Payload construido con ${sedesPayload.length} sedes`);

    const wpPayload = {
      title: despacho.nombre,
      slug: despacho.slug,
      content: descripcion,
      status: despacho.estado_publicacion || 'publish',
      meta: {
        _despacho_estado_verificacion: despacho.estado_verificacion,
        _despacho_is_verified: despacho.estado_verificacion === 'verificado' ? '1' : '0',
        _despacho_sedes: sedesPayload
      }
    };

    // PASO 3: Enviar a WordPress
    console.log('\n📤 PASO 3: Enviando a WordPress...');
    console.log('-'.repeat(70));

    const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');
    const wpUrl = despacho.wordpress_id 
      ? `${WP_API_URL}/${despacho.wordpress_id}`
      : WP_API_URL;
    const wpMethod = despacho.wordpress_id ? 'PUT' : 'POST';

    console.log(`   Método: ${wpMethod}`);
    console.log(`   URL: ${wpUrl}`);

    const wpResp = await fetch(wpUrl, {
      method: wpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${wpAuth}`
      },
      body: JSON.stringify(wpPayload)
    });

    if (!wpResp.ok) {
      const errorText = await wpResp.text();
      throw new Error(`WordPress error (${wpResp.status}): ${errorText}`);
    }

    const wpData = await wpResp.json();
    const wordpressId = wpData.id;

    console.log(`✅ Enviado a WordPress exitosamente`);
    console.log(`   WordPress ID: ${wordpressId}`);
    console.log(`   Sedes sincronizadas: ${wpPayload.meta._despacho_sedes.length}`);

    // PASO 4: Sincronizar con Algolia
    console.log('\n🔍 PASO 4: Sincronizando con Algolia...');
    console.log('-'.repeat(70));

    const algoliaUrl = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/despachos_v3/${wordpressId}`;

    // GET registro actual
    console.log('   Obteniendo registro actual...');
    const algoliaGetResp = await fetch(algoliaUrl, {
      method: 'GET',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID
      }
    });

    if (!algoliaGetResp.ok) {
      throw new Error(`Algolia GET error: ${algoliaGetResp.status}`);
    }

    const registroActual = await algoliaGetResp.json();
    console.log(`   Registro obtenido: ${registroActual.nombre}`);
    console.log(`   Sedes en Algolia: ${registroActual.sedes?.length || 0}`);

    // Actualizar verificación en sedes
    if (registroActual.sedes && Array.isArray(registroActual.sedes)) {
      const estadoVerif = despacho.estado_verificacion || 'pendiente';
      const isVerif = estadoVerif === 'verificado';

      console.log(`   Actualizando ${registroActual.sedes.length} sedes a: ${estadoVerif}`);

      registroActual.sedes = registroActual.sedes.map((sede) => ({
        ...sede,
        estado_verificacion: estadoVerif,
        is_verified: isVerif ? 'Sí' : 'No'
      }));
    }

    // PUT registro completo
    console.log('   Guardando registro actualizado...');
    const algoliaPutResp = await fetch(algoliaUrl, {
      method: 'PUT',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registroActual)
    });

    if (!algoliaPutResp.ok) {
      throw new Error(`Algolia PUT error: ${algoliaPutResp.status}`);
    }

    const algoliaResult = await algoliaPutResp.json();
    console.log(`✅ Algolia actualizado exitosamente`);
    console.log(`   ObjectID: ${algoliaResult.objectID}`);

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(70));
    console.log('✅ SINCRONIZACIÓN COMPLETA EXITOSA');
    console.log('='.repeat(70));
    console.log(`Despacho: ${despacho.nombre}`);
    console.log(`Estado verificación: ${despacho.estado_verificacion}`);
    console.log(`Sedes sincronizadas: ${sedes.length}`);
    console.log(`WordPress ID: ${wordpressId}`);
    console.log(`Algolia ObjectID: ${algoliaResult.objectID}`);
    console.log('');
    console.log('Ejecuta ahora: node scripts/test-sincronizacion.js');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
