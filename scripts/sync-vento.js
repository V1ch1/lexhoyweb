/**
 * Script para forzar la sincronización completa de Vento
 *
 * Este script:
 * 1. Obtiene el despacho Vento con todas sus sedes desde Supabase
 * 2. Envía todo a WordPress (título, meta, sedes completas)
 * 3. Sincroniza con Algolia
 */

import { SyncService } from "../lib/syncService.js";

const VENTO_ID = "33792fd3-4f9a-412a-a399-c10f63c675f9";

async function syncVento() {
  console.log("🔄 Iniciando sincronización completa de Vento...\n");
  console.log("=".repeat(60));

  try {
    // PASO 1: Enviar a WordPress
    console.log("\n📤 PASO 1: Enviando a WordPress...");
    console.log("-".repeat(60));

    const wpResult = await SyncService.enviarDespachoAWordPress(
      VENTO_ID,
      false
    );

    if (!wpResult.success) {
      console.error("❌ Error al enviar a WordPress:", wpResult.error);
      return;
    }

    console.log("✅ Enviado correctamente a WordPress");
    console.log(`   WordPress ID: ${wpResult.wordpressId}`);
    console.log(`   Object ID: ${wpResult.objectId}`);

    // PASO 2: Sincronizar con Algolia
    if (wpResult.objectId) {
      console.log("\n🔍 PASO 2: Sincronizando con Algolia...");
      console.log("-".repeat(60));

      const algoliaResult = await SyncService.sincronizarConAlgolia(
        VENTO_ID,
        wpResult.objectId
      );

      if (!algoliaResult.success) {
        console.error(
          "❌ Error al sincronizar con Algolia:",
          algoliaResult.error
        );
        return;
      }

      console.log("✅ Sincronizado correctamente con Algolia");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SINCRONIZACIÓN COMPLETA\n");
    console.log("Ahora ejecuta: node scripts/test-sincronizacion.js");
    console.log("Para verificar que todo está correcto\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
  }
}

syncVento().catch(console.error);
