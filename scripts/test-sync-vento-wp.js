// Script para probar la sincronización de Vento a WordPress con DataTransformer
// node scripts/test-sync-vento-wp.js

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

// Cargar variables de entorno desde .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env.local") });

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APPLICATION_PASSWORD;

const VENTO_ID = "33792fd3-4f9a-412a-a399-c10f63c675f9";

async function testSync() {
  console.log("🧪 Probando sincronización de Vento a WordPress...\n");

  try {
    // 1. Obtener Vento de Supabase
    console.log("1️⃣ Obteniendo Vento de Supabase...");
    const supabaseResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/despachos?id=eq.${VENTO_ID}&select=*,sedes(*)`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!supabaseResponse.ok) {
      throw new Error(`Error Supabase: ${supabaseResponse.statusText}`);
    }

    const despachos = await supabaseResponse.json();
    if (!despachos || despachos.length === 0) {
      throw new Error("Vento no encontrado en Supabase");
    }

    const despacho = despachos[0];
    console.log(`   ✅ Vento encontrado: ${despacho.nombre}`);
    console.log(`   📍 Sedes: ${despacho.sedes?.length || 0}`);
    console.log(`   🆔 Object ID actual: ${despacho.object_id || "ninguno"}\n`);

    // 2. Llamar a la API de Next.js para sincronizar
    console.log("2️⃣ Llamando a API de sincronización...");
    const syncResponse = await fetch(
      `http://localhost:3000/api/despachos/${VENTO_ID}/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json().catch(() => ({}));
      throw new Error(`Error en API: ${JSON.stringify(errorData)}`);
    }

    const result = await syncResponse.json();
    console.log(`   ✅ Sincronización completada`);
    console.log(`   📝 Resultado:`, result);

    // 3. Verificar en WordPress
    if (result.objectId) {
      console.log(
        `\n3️⃣ Verificando en WordPress (Post ID: ${result.objectId})...`
      );
      const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString(
        "base64"
      );

      const wpResponse = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho/${result.objectId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (wpResponse.ok) {
        const wpData = await wpResponse.json();
        console.log(`   ✅ Post encontrado en WordPress`);
        console.log(`   📄 Título: ${wpData.title?.rendered || wpData.title}`);
        console.log(`   🏷️ Slug: ${wpData.slug}`);
        console.log(`   📊 Estado: ${wpData.status}`);

        // Verificar sedes
        const numSedes = wpData.meta?._despacho_num_sedes || 0;
        console.log(`   📍 Número de sedes en meta: ${numSedes}`);

        if (numSedes > 0) {
          console.log(`   🔍 Sedes guardadas:`);
          for (let i = 0; i < numSedes; i++) {
            const sedeKey = `_despacho_sede_${i}`;
            if (wpData.meta[sedeKey]) {
              try {
                const sede = JSON.parse(wpData.meta[sedeKey]);
                console.log(
                  `      ${i + 1}. ${sede.nombre} - ${sede.localidad}, ${sede.provincia}`
                );
                console.log(
                  `         Áreas: ${sede.areas_practica?.length || 0}`
                );
              } catch (e) {
                console.log(
                  `      ${i + 1}. Error parseando: ${wpData.meta[sedeKey].substring(0, 50)}...`
                );
              }
            }
          }
        }
      } else {
        console.log(
          `   ⚠️ No se pudo obtener el post de WordPress: ${wpResponse.statusText}`
        );
      }
    }

    console.log("\n✅ Prueba completada exitosamente!");
  } catch (error) {
    console.error("\n❌ Error en la prueba:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testSync();
