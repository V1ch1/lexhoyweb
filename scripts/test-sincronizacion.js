/**
 * Test de Sincronización: Next.js → WordPress → Algolia
 *
 * Este script prueba el flujo completo de sincronización de verificación
 * para el despacho Vento (ID: 68822)
 */

// Configuración
const DESPACHO_SLUG = "vento-abogados-asesores";
const WORDPRESS_ID = 74971;

async function testSincronizacion() {
  console.log("🧪 INICIANDO TESTS DE SINCRONIZACIÓN\n");
  console.log("=".repeat(60));

  try {
    // PASO 1: Verificar WordPress
    console.log("\n📊 PASO 3: Verificar en WordPress");
    console.log("-".repeat(60));

    const wpResp = await fetch(
      `https://lexhoy.com/wp-json/wp/v2/despacho/${WORDPRESS_ID}`
    );
    const wpData = await wpResp.json();

    if (wpData.code) {
      console.log(`❌ ERROR en WordPress: ${wpData.message}`);
      console.log(`   Código: ${wpData.code}`);
      console.log(`   Status: ${wpResp.status}`);
      return;
    }

    console.log(`✅ Despacho en WordPress:`);
    console.log(`   Título: ${wpData.title?.rendered || "N/A"}`);
    console.log(
      `   Estado verificación (meta): ${wpData.meta?._despacho_estado_verificacion || "N/A"}`
    );
    console.log(
      `   Is verified (meta): ${wpData.meta?._despacho_is_verified || "N/A"}`
    );
    console.log(
      `   Número de sedes: ${wpData.meta?._despacho_sedes?.length || 0}`
    );

    if (
      wpData.meta?._despacho_sedes &&
      wpData.meta._despacho_sedes.length > 0
    ) {
      console.log(`\n   Primera sede:`);
      console.log(
        `      Nombre: ${wpData.meta._despacho_sedes[0].nombre || "N/A"}`
      );
      console.log(
        `      Estado verificación: ${wpData.meta._despacho_sedes[0].estado_verificacion || "N/A"}`
      );
      console.log(
        `      Is verified: ${wpData.meta._despacho_sedes[0].is_verified || "N/A"}`
      );
    }

    const wpEstado = wpData.meta?._despacho_estado_verificacion;
    const wpSedeEstado = wpData.meta?._despacho_sedes?.[0]?.estado_verificacion;

    // PASO 2: Verificar Algolia
    console.log("\n📊 PASO 2: Verificar en Algolia");
    console.log("-".repeat(60));

    const algoliaAppId = "GA06AGLT12";
    const algoliaSearchKey = "dcec9a6a746edae820a86f53e57e60e4";

    const algoliaResp = await fetch(
      `https://${algoliaAppId}-dsn.algolia.net/1/indexes/despachos_v3/query`,
      {
        method: "POST",
        headers: {
          "X-Algolia-API-Key": algoliaSearchKey,
          "X-Algolia-Application-Id": algoliaAppId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "vento",
          hitsPerPage: 1,
        }),
      }
    );

    const algoliaData = await algoliaResp.json();
    const algoliaVento = algoliaData.hits[0];

    if (algoliaVento) {
      console.log(`✅ Despacho en Algolia:`);
      console.log(`   Nombre: ${algoliaVento.nombre}`);
      console.log(`   Object ID: ${algoliaVento.objectID}`);
      console.log(`   Número de sedes: ${algoliaVento.sedes?.length || 0}`);

      if (algoliaVento.sedes && algoliaVento.sedes.length > 0) {
        console.log(`\n   Primera sede:`);
        console.log(`      Nombre: ${algoliaVento.sedes[0].nombre}`);
        console.log(`      Localidad: ${algoliaVento.sedes[0].localidad}`);
        console.log(
          `      Estado verificación: ${algoliaVento.sedes[0].estado_verificacion}`
        );
        console.log(`      Is verified: ${algoliaVento.sedes[0].is_verified}`);
      }
    }

    // PASO 3: Verificar consistencia
    console.log("\n🔍 PASO 3: Verificar consistencia entre sistemas");
    console.log("-".repeat(60));

    const algoliaEstado = algoliaVento?.sedes?.[0]?.estado_verificacion;

    console.log(`   WordPress meta despacho: ${wpEstado}`);
    console.log(`   WordPress meta sede[0]: ${wpSedeEstado}`);
    console.log(`   Algolia sede[0]: ${algoliaEstado}`);

    const todosIguales =
      wpEstado === wpSedeEstado && wpSedeEstado === algoliaEstado;

    if (todosIguales) {
      console.log(`\n✅ WORDPRESS Y ALGOLIA ESTÁN SINCRONIZADOS`);
    } else {
      console.log(`\n❌ INCONSISTENCIA DETECTADA:`);
      if (wpEstado !== wpSedeEstado) {
        console.log(
          `   ⚠️  WordPress despacho (${wpEstado}) ≠ WordPress sede (${wpSedeEstado})`
        );
      }
      if (wpSedeEstado !== algoliaEstado) {
        console.log(
          `   ⚠️  WordPress sede (${wpSedeEstado}) ≠ Algolia (${algoliaEstado})`
        );
      }
    }

    // PASO 4: Verificar sitio público
    console.log("\n🌐 PASO 4: Verificar sitio público");
    console.log("-".repeat(60));
    console.log(`   URL: https://lexhoy.com/${DESPACHO_SLUG}/`);
    console.log(`   Revisa manualmente si muestra el estado correcto`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ TESTS COMPLETADOS\n");
  } catch (error) {
    console.error("\n❌ ERROR EN LOS TESTS:", error);
  }
}

// Ejecutar tests
testSincronizacion().catch(console.error);
