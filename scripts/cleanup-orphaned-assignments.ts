/**
 * Script de Limpieza de Asignaciones Huérfanas
 * 
 * Elimina asignaciones en user_despachos que apuntan a despachos inexistentes
 * 
 * Uso:
 *   npx tsx scripts/cleanup-orphaned-assignments.ts --dry-run   # Preview
 *   npx tsx scripts/cleanup-orphaned-assignments.ts --execute   # Ejecutar
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ Error: No se encontró .env.local");
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && value) process.env[key.trim()] = value.trim();
    }
  });
}

loadEnvFile();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isDryRun = process.argv.includes("--dry-run");
const isExecute = process.argv.includes("--execute");

if (!isDryRun && !isExecute) {
  console.error("❌ Error: Debes especificar --dry-run o --execute");
  console.log("\nUso:");
  console.log("  npx tsx scripts/cleanup-orphaned-assignments.ts --dry-run");
  console.log("  npx tsx scripts/cleanup-orphaned-assignments.ts --execute");
  process.exit(1);
}

async function cleanupOrphanedAssignments() {
  console.log("🧹 LIMPIEZA DE ASIGNACIONES HUÉRFANAS");
  console.log("=".repeat(80));
  console.log(`Modo: ${isDryRun ? "DRY-RUN (preview)" : "EJECUCIÓN REAL"}\n`);

  // 1. Obtener todos los despachos
  const { data: despachos, error: despachosError } = await supabase
    .from("despachos")
    .select("id, object_id, nombre");

  if (despachosError) {
    console.error("❌ Error al obtener despachos:", despachosError.message);
    process.exit(1);
  }

  const validDespachoIds = new Set(despachos?.map(d => d.object_id) || []);
  console.log(`✅ Despachos válidos encontrados: ${validDespachoIds.size}\n`);

  // 2. Obtener todas las asignaciones activas
  const { data: userDespachos, error: udError } = await supabase
    .from("user_despachos")
    .select("*")
    .eq("activo", true);

  if (udError) {
    console.error("❌ Error al obtener asignaciones:", udError.message);
    process.exit(1);
  }

  console.log(`📦 Asignaciones activas encontradas: ${userDespachos?.length || 0}\n`);

  // 3. Identificar asignaciones huérfanas
  const orphanedAssignments = [];

  for (const ud of userDespachos || []) {
    const isOrphaned = !validDespachoIds.has(ud.despacho_id);
    
    if (isOrphaned) {
      // Obtener datos del usuario
      const { data: user } = await supabase
        .from("users")
        .select("email, nombre, apellidos")
        .eq("id", ud.user_id)
        .single();

      orphanedAssignments.push({
        id: ud.id,
        user_id: ud.user_id,
        user_email: user?.email || "Desconocido",
        user_name: `${user?.nombre || ""} ${user?.apellidos || ""}`.trim(),
        despacho_id: ud.despacho_id,
        fecha_asignacion: ud.fecha_asignacion,
        permisos: ud.permisos,
      });
    }
  }

  console.log(`🔍 Asignaciones huérfanas encontradas: ${orphanedAssignments.length}\n`);

  if (orphanedAssignments.length === 0) {
    console.log("✅ No hay asignaciones huérfanas para limpiar");
    return;
  }

  // 4. Mostrar detalles
  console.log("Detalle de asignaciones a eliminar:\n");
  orphanedAssignments.forEach((oa, i) => {
    console.log(`${i + 1}. Usuario: ${oa.user_email} (${oa.user_name})`);
    console.log(`   Despacho ID (inexistente): ${oa.despacho_id}`);
    console.log(`   Fecha asignación: ${new Date(oa.fecha_asignacion).toLocaleString()}`);
    console.log(`   Permisos: ${JSON.stringify(oa.permisos)}`);
    console.log(`   ID asignación: ${oa.id}\n`);
  });

  // 5. Ejecutar limpieza si no es dry-run
  if (isExecute) {
    console.log("=".repeat(80));
    console.log("⚠️  EJECUTANDO LIMPIEZA...\n");

    const results = {
      success: [],
      failed: [],
    };

    for (const oa of orphanedAssignments) {
      console.log(`Eliminando asignación de ${oa.user_email}...`);
      
      const { error } = await supabase
        .from("user_despachos")
        .delete()
        .eq("id", oa.id);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.failed.push({ ...oa, error: error.message });
      } else {
        console.log(`   ✅ Eliminada correctamente`);
        results.success.push(oa);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DE LIMPIEZA");
    console.log("=".repeat(80));
    console.log(`✅ Eliminadas exitosamente: ${results.success.length}`);
    console.log(`❌ Errores: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log("\nErrores:");
      results.failed.forEach((f, i) => {
        console.log(`${i + 1}. ${f.user_email}: ${f.error}`);
      });
    }

    // Guardar log de cambios
    const logPath = path.join(process.cwd(), "cleanup-log.json");
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Log guardado en: ${logPath}`);

  } else {
    console.log("=".repeat(80));
    console.log("ℹ️  DRY-RUN COMPLETADO");
    console.log("=".repeat(80));
    console.log("\nPara ejecutar la limpieza real, usa:");
    console.log("  npx tsx scripts/cleanup-orphaned-assignments.ts --execute\n");
  }
}

cleanupOrphanedAssignments()
  .then(() => {
    console.log("\n✨ Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
