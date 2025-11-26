// Script para debuggear por qué aparecen "Sin nombre" en el dashboard
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oepcitgbnqylfpdryffx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcGNpdGdibnF5bGZwZHJ5ZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzEwNzYsImV4cCI6MjA3NDEwNzA3Nn0.jjTweQk3kl3V4VQ6aZM6zLPU2j4ntT1qJ1ZmVHPQAaw";

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = "1be79267-712e-4168-81be-641443989690";

console.log("\n=== DEBUG: User Despachos ===\n");
console.log(`User ID: ${userId}\n`);

try {
  // 1. Obtener relaciones user_despachos
  console.log("📊 PASO 1: Consultar user_despachos");
  const { data: userDespachos, error: userDespachosError } = await supabase
    .from("user_despachos")
    .select("*")
    .eq("usuario_id", userId)
    .eq("activo", true);

  if (userDespachosError) {
    console.error("❌ Error en user_despachos:", userDespachosError);
    process.exit(1);
  }

  console.log(
    `✅ Encontradas ${userDespachos?.length || 0} relaciones activas`
  );
  if (userDespachos && userDespachos.length > 0) {
    userDespachos.forEach((ud, i) => {
      console.log(`   ${i + 1}. Despacho ID: ${ud.despacho_id}`);
    });
  }
  console.log("");

  if (!userDespachos || userDespachos.length === 0) {
    console.log("⚠️  Usuario no tiene despachos asignados");
    process.exit(0);
  }

  // 2. Obtener IDs
  const despachoIds = userDespachos.map((ud) => ud.despacho_id);
  console.log(`📋 PASO 2: IDs de despachos a consultar: ${despachoIds.length}`);
  console.log(`   IDs: ${JSON.stringify(despachoIds, null, 2)}`);
  console.log("");

  // 3. Consultar despachos
  console.log("🔍 PASO 3: Consultar tabla despachos con .in()");
  const { data: despachos, error: despachosError } = await supabase
    .from("despachos")
    .select("*")
    .in("id", despachoIds);

  if (despachosError) {
    console.error("❌ Error al consultar despachos:", despachosError);
    process.exit(1);
  }

  console.log(`✅ Despachos encontrados: ${despachos?.length || 0}`);
  console.log("");

  // 4. Mostrar detalles de cada despacho
  console.log("📝 PASO 4: Detalles de los despachos encontrados");
  if (despachos && despachos.length > 0) {
    despachos.forEach((d, i) => {
      console.log(`\n   ${i + 1}. Despacho:`);
      console.log(`      ID: ${d.id}`);
      console.log(`      Nombre: "${d.nombre || "NULL/VACÍO"}"`);
      console.log(`      Slug: "${d.slug || "NULL/VACÍO"}"`);
      console.log(`      Created: ${d.created_at}`);
    });
  } else {
    console.log("   ⚠️  No se encontraron despachos con esos IDs");
  }
  console.log("");

  // 5. Verificar cuáles NO se encontraron
  console.log("🔍 PASO 5: Verificar IDs faltantes");
  const foundIds = despachos?.map((d) => d.id) || [];
  const missingIds = despachoIds.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    console.log(`⚠️  IDs NO ENCONTRADOS en la tabla despachos:`);
    missingIds.forEach((id) => {
      console.log(`   - ${id}`);
    });
    console.log("");

    // Verificar si esos IDs existen con otra consulta
    console.log("🔍 Verificando si esos IDs existen realmente...");
    for (const missingId of missingIds) {
      const { data, error } = await supabase
        .from("despachos")
        .select("id, nombre, slug")
        .eq("id", missingId)
        .single();

      if (error) {
        console.log(`   ❌ ID ${missingId}: NO EXISTE en tabla despachos`);
      } else {
        console.log(
          `   ✅ ID ${missingId}: SÍ EXISTE - Nombre: "${data.nombre}"`
        );
      }
    }
  } else {
    console.log("✅ Todos los IDs fueron encontrados");
  }
  console.log("");

  // 6. Simular transformación del endpoint
  console.log("🔄 PASO 6: Simular transformación del endpoint");
  const sedesCount = {};
  for (const despachoId of despachoIds) {
    const { count } = await supabase
      .from("sedes")
      .select("*", { count: "exact", head: true })
      .eq("despacho_id", despachoId)
      .eq("activa", true);
    sedesCount[despachoId] = count || 0;
  }

  const transformedDespachos = userDespachos.map((ud) => {
    const despacho = despachos?.find((d) => d.id === ud.despacho_id);
    return {
      id: ud.despacho_id,
      nombre: despacho?.nombre || "Sin nombre",
      slug: despacho?.slug || "sin-slug",
      num_sedes: sedesCount[ud.despacho_id] || 0,
    };
  });

  console.log("📊 Resultado final (como lo ve el frontend):");
  transformedDespachos.forEach((d, i) => {
    const status = d.nombre === "Sin nombre" ? "❌" : "✅";
    console.log(`   ${status} ${i + 1}. "${d.nombre}" (${d.num_sedes} sedes)`);
  });
  console.log("");

  // 7. Resumen
  const sinNombre = transformedDespachos.filter(
    (d) => d.nombre === "Sin nombre"
  );
  if (sinNombre.length > 0) {
    console.log("❌ PROBLEMA ENCONTRADO:");
    console.log(
      `   ${sinNombre.length} despacho(s) aparecen como "Sin nombre"`
    );
    console.log("   IDs problemáticos:");
    sinNombre.forEach((d) => {
      console.log(`   - ${d.id}`);
    });
  } else {
    console.log(
      "✅ No se encontraron problemas - todos los despachos tienen nombre"
    );
  }
} catch (error) {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
}
